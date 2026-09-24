"""BigQuery Loader Module for loading transformed data into BigQuery tables."""
import logging
import os
import sys
import pandas as pd
from google.cloud import bigquery

logger = logging.getLogger("etl.loader")


class BigQueryLoader:
    def __init__(self, project_id: str = None, dataset_id: str = None, table_id: str = None, write_disposition: str = "WRITE_TRUNCATE"):
        self.project_id = project_id or os.getenv("GCP_PROJECT_ID", "upbeat-repeater-477110-q6")
        self.dataset_id = dataset_id or os.getenv("BIGQUERY_DATASET", "analytics")
        self.table_id = table_id or os.getenv("BIGQUERY_TABLE", "test02")
        self.write_disposition = write_disposition

    def load(self, df: pd.DataFrame) -> bool:
        """Loads transformed DataFrame into BigQuery table with schema and sorting preserved."""
        if df is None or df.empty:
            logger.warning("No records to load. Skipping BigQuery load.")
            return True

        logger.info("Initializing BigQuery client for project '%s'...", self.project_id)
        client = bigquery.Client(project=self.project_id) if self.project_id else bigquery.Client()
        if not self.project_id and getattr(client, "project", None):
            self.project_id = client.project

        table_ref = f"{self.project_id}.{self.dataset_id}.{self.table_id}"
        logger.info("Target BigQuery table: %s", table_ref)

        disposition = (
            bigquery.WriteDisposition.WRITE_APPEND
            if self.write_disposition == "WRITE_APPEND"
            else bigquery.WriteDisposition.WRITE_TRUNCATE
        )

        job_config = bigquery.LoadJobConfig(
            write_disposition=disposition,
        )

        # Attempt to load schema definition if available
        schema_path = os.path.join("schemas", f"{self.table_id}_schema.json")
        if os.path.isfile(schema_path):
            try:
                job_config.schema = client.schema_from_json(schema_path)
                logger.info("Loaded BigQuery table schema from %s", schema_path)
            except (ValueError, KeyError) as schema_err:
                logger.error("Failed to parse schema from %s: %s", schema_path, schema_err)
                raise RuntimeError(f"FATAL: Schema configuration invalid: {schema_err}") from schema_err

        logger.info("Starting BigQuery load job for %d rows...", len(df))
        job = client.load_table_from_dataframe(df, table_ref, job_config=job_config)
        job.result()  # Wait for completion

        if job.errors:
            raise RuntimeError(f"FATAL: BigQuery load job failed: {job.errors}")

        logger.info("BigQuery load job completed successfully. Target: %s (%d rows)", table_ref, len(df))
        return True
