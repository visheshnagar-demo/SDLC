"""Google BigQuery Ingestion Loader Module."""
import os
import logging
from typing import Optional

try:
    import pandas as pd
except ImportError:
    pd = None

try:
    from google.cloud import bigquery
    from google.cloud.exceptions import NotFound
except ImportError:
    bigquery = None
    NotFound = Exception

logger = logging.getLogger(__name__)


class BigQueryLoader:
    """Loads transformed data into Google BigQuery."""

    def __init__(
        self,
        project_id: Optional[str] = None,
        dataset_id: Optional[str] = None,
        table_id: Optional[str] = None,
        write_disposition: Optional[str] = None
    ):
        if project_id is not None:
            self.project_id = project_id
        else:
            self.project_id = os.getenv("GCP_PROJECT_ID") or os.getenv("PROJECT_ID")

        self.dataset_id = (
            dataset_id
            or os.getenv("BQ_DATASET")
            or "analytics"
        )
        self.table_id = (
            table_id
            or os.getenv("BQ_TABLE")
            or "postgres_test1"
        )
        self.write_disposition = (
            write_disposition
            or os.getenv("WRITE_DISPOSITION")
            or "WRITE_TRUNCATE"
        ).upper()

        if not self.project_id:
            raise EnvironmentError("GCP_PROJECT_ID environment variable is required.")

        if bigquery is not None:
            self.client = bigquery.Client(project=self.project_id)
        else:
            self.client = None
        self.full_table_id = f"{self.project_id}.{self.dataset_id}.{self.table_id}"

    def ensure_dataset(self) -> None:
        """Ensures the destination BigQuery dataset exists in the project."""
        if self.client is None:
            raise RuntimeError("google-cloud-bigquery client is not initialized or credentials missing.")

        dataset_ref = bigquery.DatasetReference(self.project_id, self.dataset_id)
        try:
            self.client.get_dataset(dataset_ref)
            logger.info("Dataset '%s' verified.", self.dataset_id)
        except NotFound:
            logger.info("Dataset '%s' not found. Creating in region '%s'...", self.dataset_id, os.getenv("GCP_REGION", "us-central1"))
            dataset = bigquery.Dataset(dataset_ref)
            dataset.location = os.getenv("GCP_REGION", "us-central1")
            self.client.create_dataset(dataset, timeout=30)
            logger.info("Dataset '%s' created successfully.", self.dataset_id)

    def load(self, df) -> int:
        """Loads the provided DataFrame into the target BigQuery table."""
        if df is None or getattr(df, "empty", len(df) == 0):
            logger.warning("Empty DataFrame provided to BigQueryLoader; skipping load.")
            return 0

        self.ensure_dataset()

        disposition_enum = getattr(
            bigquery.WriteDisposition,
            self.write_disposition,
            getattr(bigquery.WriteDisposition, "WRITE_TRUNCATE", "WRITE_TRUNCATE")
        )

        job_config = bigquery.LoadJobConfig(
            write_disposition=disposition_enum,
            autodetect=True
        )

        logger.info(
            "Starting BigQuery load job into %s (disposition: %s, rows: %d)...",
            self.full_table_id,
            self.write_disposition,
            len(df)
        )

        job = self.client.load_table_from_dataframe(
            df,
            self.full_table_id,
            job_config=job_config
        )
        job.result()  # Waits for the job to complete

        table = self.client.get_table(self.full_table_id)
        logger.info(
            "BigQuery load job finished successfully. Table %s total rows: %d.",
            self.full_table_id,
            table.num_rows
        )
        return len(df)
