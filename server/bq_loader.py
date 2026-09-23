import logging
from typing import Optional, Dict, Any
import pandas as pd
from google.cloud import bigquery
from server.config import settings

logger = logging.getLogger("etl.loader")

POSTGRES_TEST2_BQ_SCHEMA = [
    bigquery.SchemaField(
        "id", "STRING", mode="REQUIRED", description="Unique record identifier"
    ),
    bigquery.SchemaField(
        "name", "STRING", mode="NULLABLE", description="Entity name, whitespace trimmed"
    ),
    bigquery.SchemaField(
        "category", "STRING", mode="NULLABLE", description="Category classification"
    ),
    bigquery.SchemaField(
        "amount", "FLOAT64", mode="NULLABLE", description="Numeric amount value"
    ),
    bigquery.SchemaField(
        "status", "STRING", mode="NULLABLE", description="Status code"
    ),
    bigquery.SchemaField(
        "created_at",
        "TIMESTAMP",
        mode="NULLABLE",
        description="Record creation timestamp",
    ),
    bigquery.SchemaField(
        "updated_at", "TIMESTAMP", mode="NULLABLE", description="Last update timestamp"
    ),
    bigquery.SchemaField(
        "_etl_loaded_at",
        "TIMESTAMP",
        mode="REQUIRED",
        description="Pipeline audit timestamp",
    ),
]


class BigQueryLoader:
    def __init__(
        self,
        project_id: Optional[str] = None,
        dataset_id: Optional[str] = None,
        table_id: Optional[str] = None,
        client: Optional[bigquery.Client] = None,
    ):
        self.project_id = project_id or settings.GCP_PROJECT
        self.dataset_id = dataset_id or settings.BQ_DATASET
        self.table_id = table_id or settings.BQ_TARGET_TABLE
        self._client = client

    @property
    def client(self) -> bigquery.Client:
        if self._client is None:
            self._client = bigquery.Client(project=self.project_id)
        return self._client

    @property
    def full_table_id(self) -> str:
        return f"{self.project_id}.{self.dataset_id}.{self.table_id}"

    def load_dataframe(
        self,
        df: pd.DataFrame,
        write_disposition: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Loads a pandas DataFrame into the BigQuery target table."""
        if df.empty:
            logger.info("DataFrame is empty. Skipping BigQuery load job.")
            return {
                "status": "SKIPPED",
                "table_id": self.full_table_id,
                "rows_loaded": 0,
            }

        disposition = write_disposition or settings.BQ_WRITE_DISPOSITION
        job_config = bigquery.LoadJobConfig(
            schema=POSTGRES_TEST2_BQ_SCHEMA,
            write_disposition=disposition,
        )

        logger.info(
            "Submitting BigQuery load job for %d rows to table '%s' with disposition '%s'",
            len(df),
            self.full_table_id,
            disposition,
        )

        job = self.client.load_table_from_dataframe(
            df, self.full_table_id, job_config=job_config
        )
        job.result()  # Wait for the load job to complete

        logger.info("BigQuery load job %s completed successfully.", job.job_id)
        return {
            "status": "SUCCESS",
            "job_id": job.job_id,
            "table_id": self.full_table_id,
            "rows_loaded": len(df),
        }
