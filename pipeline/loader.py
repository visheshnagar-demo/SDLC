"""BigQuery Loader module.

Loads transformed DataFrames into Google BigQuery.
Zero-mock policy: executes real BigQuery load jobs and raises on errors.
"""
import os
import logging
import pandas as pd
from google.cloud import bigquery

logger = logging.getLogger("pipeline.loader")


class BigQueryLoader:
    """Loads cleaned DataFrames into target BigQuery tables."""

    def __init__(
        self,
        project_id: str = None,
        dataset_id: str = None,
        table_id: str = None,
        write_disposition: str = "WRITE_TRUNCATE",
    ):
        self.project_id = (
            project_id
            or os.getenv("GCP_PROJECT_ID")
            or os.getenv("PROJECT_ID")
            or os.getenv("GOOGLE_CLOUD_PROJECT")
            or os.getenv("GCLOUD_PROJECT")
        )
        self.dataset_id = dataset_id or os.getenv("BIGQUERY_DATASET", "analytics")
        self.table_id = table_id or os.getenv("BIGQUERY_TABLE", "postgres_test2")
        self.write_disposition = write_disposition

    def load(self, df: pd.DataFrame) -> bool:
        """Loads DataFrame into target BigQuery table.

        Args:
            df: Transformed DataFrame.

        Returns:
            True on successful load.

        Raises:
            EnvironmentError: If GCP project is not configured.
            RuntimeError: If BigQuery load job fails.
        """
        if not self.project_id:
            raise EnvironmentError(
                "FATAL: GCP_PROJECT_ID or PROJECT_ID environment variable is missing for BigQuery loading."
            )

        if df is None or df.empty:
            logger.warning("Empty DataFrame provided for loading. Skipping BigQuery load.")
            return True

        table_ref = f"{self.project_id}.{self.dataset_id}.{self.table_id}"
        logger.info("Initializing BigQuery client for project '%s'...", self.project_id)
        client = bigquery.Client(project=self.project_id)

        disposition = (
            bigquery.WriteDisposition.WRITE_APPEND
            if self.write_disposition == "WRITE_APPEND"
            else bigquery.WriteDisposition.WRITE_TRUNCATE
        )

        job_config = bigquery.LoadJobConfig(write_disposition=disposition)

        # Attempt to load schema definition
        schema_paths = [
            os.path.join("schemas", f"{self.table_id}_schema.json"),
            os.path.join("schemas", "postgres_test2_schema.json"),
        ]
        for path in schema_paths:
            if os.path.isfile(path):
                job_config.schema = client.schema_from_json(path)
                logger.info("Loaded BigQuery schema from %s", path)
                break

        if disposition == bigquery.WriteDisposition.WRITE_APPEND:
            job_config.schema_update_options = [
                bigquery.SchemaUpdateOption.ALLOW_FIELD_ADDITION,
                bigquery.SchemaUpdateOption.ALLOW_FIELD_RELAXATION,
            ]

        logger.info("Submitting BigQuery load job for %d rows to '%s'...", len(df), table_ref)
        job = client.load_table_from_dataframe(df, table_ref, job_config=job_config)
        job.result()  # Wait for completion

        if job.errors:
            logger.error("BigQuery load job encountered errors: %s", job.errors)
            raise RuntimeError(f"BigQuery load job failed: {job.errors}")

        logger.info("Successfully loaded %d records into BigQuery table '%s'", len(df), table_ref)
        return True
