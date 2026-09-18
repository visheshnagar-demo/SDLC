"""BigQuery Loader Module."""
import os
import logging
from typing import Optional

try:
    import pandas as pd
except ImportError:
    pd = None

try:
    from google.cloud import bigquery
except ImportError:
    bigquery = None

logger = logging.getLogger(__name__)


class BigQueryLoader:
    """Loads validated DataFrame into target BigQuery table."""

    def __init__(
        self,
        project_id: Optional[str] = None,
        dataset_id: Optional[str] = None,
        table_id: Optional[str] = None,
        write_disposition: Optional[str] = None,
    ):
        self.project_id = project_id or os.getenv("GCP_PROJECT_ID") or os.getenv("PROJECT_ID", "upbeat-repeater-477110-q6")
        self.dataset_id = dataset_id or os.getenv("BIGQUERY_DATASET") or os.getenv("BQ_DATASET_ID", "analytics")
        self.table_id = table_id or os.getenv("BIGQUERY_TABLE") or os.getenv("BQ_TABLE_ID", "test1")
        self.write_disposition = write_disposition or os.getenv("BQ_WRITE_DISPOSITION", "WRITE_TRUNCATE")

        if not self.project_id:
            raise EnvironmentError("FATAL: GCP_PROJECT_ID must be set for BigQuery loading.")

    def load_dataframe(self, df) -> bool:
        """Loads DataFrame to BigQuery table using LoadJobConfig with safety checks."""
        if pd is None:
            raise RuntimeError("FATAL: pandas is required for pipeline execution.")
        if bigquery is None:
            raise RuntimeError("FATAL: google-cloud-bigquery is required for loading.")

        if df.empty:
            logger.warning("DataFrame is empty. Skipping BigQuery load.")
            return True

        table_ref = f"{self.project_id}.{self.dataset_id}.{self.table_id}"
        logger.info("Initiating BigQuery load into '%s' with disposition '%s'...", table_ref, self.write_disposition)

        client = bigquery.Client(project=self.project_id)

        disp = bigquery.WriteDisposition.WRITE_TRUNCATE
        if str(self.write_disposition).upper() in ("WRITE_APPEND", "APPEND"):
            disp = bigquery.WriteDisposition.WRITE_APPEND

        job_config = bigquery.LoadJobConfig(write_disposition=disp)
        if disp == bigquery.WriteDisposition.WRITE_APPEND:
            job_config.schema_update_options = [
                bigquery.SchemaUpdateOption.ALLOW_FIELD_ADDITION,
                bigquery.SchemaUpdateOption.ALLOW_FIELD_RELAXATION,
            ]

        job = client.load_table_from_dataframe(df, table_ref, job_config=job_config)
        job.result()

        if job.errors:
            raise RuntimeError(f"FATAL: BigQuery load job encountered errors: {job.errors}")

        logger.info("Successfully loaded %d rows into BigQuery table '%s'.", len(df), table_ref)
        return True
