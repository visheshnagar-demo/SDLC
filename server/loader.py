"""Loader module for inserting cleaned records into Google BigQuery."""
import os
import logging
from typing import List
import pandas as pd
from google.cloud.exceptions import NotFound, GoogleCloudError
from server.schemas.etl_schemas import CleanedPostgresTest5Record

logger = logging.getLogger(__name__)


class BigQueryLoader:
    def __init__(
        self,
        dataset_id: str = "analytics",
        table_id: str = "postgres_test5",
        project_id: str = None,
    ):
        self.project_id = (
            project_id
            or os.getenv("GCP_PROJECT_ID")
            or os.getenv("PROJECT_ID")
            or os.getenv("GOOGLE_CLOUD_PROJECT")
        )
        self.dataset_id = dataset_id or os.getenv("BIGQUERY_DATASET", "analytics")
        self.table_id = table_id or os.getenv("BIGQUERY_TABLE", "postgres_test5")

    def _get_client(self):
        from google.cloud import bigquery
        if self.project_id:
            return bigquery.Client(project=self.project_id)
        return bigquery.Client()

    def check_connection(self) -> bool:
        """Checks BigQuery connectivity."""
        try:
            client = self._get_client()
            client.query("SELECT 1").result()
            return True
        except (GoogleCloudError, EnvironmentError) as e:
            logger.warning("BigQuery connection check failed: %s", e)
            return False

    def load_records(
        self,
        records: List[CleanedPostgresTest5Record],
        write_disposition: str = "WRITE_APPEND",
    ) -> int:
        """Loads cleaned records into target BigQuery table."""
        if not records:
            logger.info("No records to load.")
            return 0

        from google.cloud import bigquery

        client = self._get_client()
        effective_project = self.project_id or getattr(client, "project", None)
        table_ref = (
            f"{effective_project}.{self.dataset_id}.{self.table_id}"
            if effective_project
            else f"{self.dataset_id}.{self.table_id}"
        )

        # Pre-create dataset if needed
        try:
            dataset_ref = client.dataset(self.dataset_id, project=effective_project)
            try:
                client.get_dataset(dataset_ref)
            except NotFound:
                ds = bigquery.Dataset(dataset_ref)
                ds.location = os.getenv("BQ_LOCATION", "us-central1")
                client.create_dataset(ds, exists_ok=True)
                logger.info("Ensured BigQuery dataset '%s' exists", self.dataset_id)
        except GoogleCloudError as ds_err:
            logger.warning("Dataset pre-check warning: %s", ds_err)

        # Prepare records for loading
        data_dicts = [r.model_dump() for r in records]
        df = pd.DataFrame(data_dicts)

        # Ensure datetime format for BigQuery load
        if "source_created_at" in df.columns:
            df["source_created_at"] = pd.to_datetime(df["source_created_at"], errors="coerce", utc=True)
        if "etl_loaded_at" in df.columns:
            df["etl_loaded_at"] = pd.to_datetime(df["etl_loaded_at"], errors="coerce", utc=True)

        job_config = bigquery.LoadJobConfig(
            write_disposition=getattr(
                bigquery.WriteDisposition,
                write_disposition.upper(),
                bigquery.WriteDisposition.WRITE_APPEND,
            ),
            create_disposition=bigquery.CreateDisposition.CREATE_IF_NEEDED,
        )

        if write_disposition.upper() == "WRITE_APPEND":
            job_config.schema_update_options = [
                bigquery.SchemaUpdateOption.ALLOW_FIELD_ADDITION,
                bigquery.SchemaUpdateOption.ALLOW_FIELD_RELAXATION,
            ]

        try:
            job = client.load_table_from_dataframe(df, table_ref, job_config=job_config)
            job.result()
        except GoogleCloudError as load_err:
            logger.warning(
                "Primary load_table_from_dataframe failed: %s. Attempting fallback via JSON load...",
                load_err,
            )
            json_rows = df.to_dict(orient="records")
            fallback_config = bigquery.LoadJobConfig(
                write_disposition=getattr(
                    bigquery.WriteDisposition,
                    write_disposition.upper(),
                    bigquery.WriteDisposition.WRITE_APPEND,
                ),
                create_disposition=bigquery.CreateDisposition.CREATE_IF_NEEDED,
                autodetect=True,
            )
            fallback_job = client.load_table_from_json(json_rows, table_ref, job_config=fallback_config)
            fallback_job.result()

        logger.info("Successfully loaded %d records into BigQuery table %s", len(df), table_ref)
        return len(df)
