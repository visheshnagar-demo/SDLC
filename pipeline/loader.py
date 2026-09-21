"""BigQuery Loader module for loading transformed DataFrames into Google BigQuery."""
import os
import logging
import pandas as pd
from google.cloud import bigquery

logger = logging.getLogger("pipeline.loader")


class BigQueryLoader:
    """Loads transformed Pandas DataFrame into BigQuery target table."""

    def __init__(
        self,
        project_id: str = None,
        dataset_id: str = None,
        table_id: str = None,
        write_mode: str = "overwrite",
    ):
        self.project_id = (
            project_id
            or os.getenv("GCP_PROJECT_ID")
            or os.getenv("PROJECT_ID")
            or os.getenv("GOOGLE_CLOUD_PROJECT")
            or "upbeat-repeater-477110-q6"
        )
        self.dataset_id = dataset_id or os.getenv("BIGQUERY_DATASET", "analytics")
        self.table_id = table_id or os.getenv("BIGQUERY_TABLE", "test3")
        self.write_mode = write_mode

    def load(self, df: pd.DataFrame) -> int:
        """Loads the provided DataFrame into BigQuery.

        Zero-mock: Real loading via BigQuery Client. Fails fast if unavailable.
        """
        if df is None or df.empty:
            logger.warning("No records to load into BigQuery.")
            return 0

        if not self.project_id:
            raise EnvironmentError("FATAL: GCP_PROJECT_ID must be set for BigQuery loading.")

        table_ref = f"{self.project_id}.{self.dataset_id}.{self.table_id}"
        logger.info("Loading %d records into BigQuery table: %s", len(df), table_ref)

        try:
            client = bigquery.Client(project=self.project_id)

            disposition = (
                bigquery.WriteDisposition.WRITE_APPEND
                if self.write_mode == "append"
                else bigquery.WriteDisposition.WRITE_TRUNCATE
            )

            job_config = bigquery.LoadJobConfig(
                write_disposition=disposition,
            )

            schema_path = os.path.join("schemas", f"{self.table_id}_schema.json")
            if not os.path.isfile(schema_path):
                schema_path = os.path.join("schemas", "test3_schema.json")

            if os.path.isfile(schema_path):
                try:
                    job_config.schema = client.schema_from_json(schema_path)
                    logger.info("Attached BigQuery schema from %s", schema_path)
                except Exception as schema_err:
                    logger.error("Failed to parse schema JSON %s: %s", schema_path, schema_err)
                    raise

            job = client.load_table_from_dataframe(df, table_ref, job_config=job_config)
            job.result()  # Wait for job completion

            if job.errors:
                raise RuntimeError(f"BigQuery load job failed with errors: {job.errors}")

            logger.info("BigQuery load completed successfully. Ingested %d rows.", len(df))
            return len(df)
        except Exception as exc:
            logger.critical("BigQuery load failed: %s", exc, exc_info=True)
            raise
