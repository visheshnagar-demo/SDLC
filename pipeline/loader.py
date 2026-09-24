"""Loader module for ingesting cleaned records into Google BigQuery."""

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

from pipeline.config import PipelineConfig

logger = logging.getLogger(__name__)


class BigQueryLoader:
    """Handles BigQuery dataset/table management and data ingestion."""

    def __init__(self, config: PipelineConfig, client: Optional[object] = None):
        self.config = config
        if client is not None:
            self.client = client
        else:
            if bigquery is None:
                raise ImportError("google.cloud.bigquery is required for BigQueryLoader")
            self.client = bigquery.Client(project=config.gcp_project)
        self.table_id = f"{config.gcp_project}.{config.bigquery_dataset}.{config.bigquery_table}"
        self.dataset_id = f"{config.gcp_project}.{config.bigquery_dataset}"

    def ensure_dataset_exists(self) -> None:
        """Create BigQuery dataset if it does not already exist."""
        try:
            self.client.get_dataset(self.dataset_id)
            logger.info(f"Dataset '{self.dataset_id}' exists.")
        except Exception as e:
            if "NotFound" in type(e).__name__ or (NotFound and isinstance(e, NotFound)):
                logger.info(f"Dataset '{self.dataset_id}' not found. Creating dataset...")
                if bigquery and hasattr(bigquery, "Dataset"):
                    dataset = bigquery.Dataset(self.dataset_id)
                    dataset.location = "US"
                    self.client.create_dataset(dataset, exists_ok=True)
                else:
                    self.client.create_dataset(self.dataset_id, exists_ok=True)
                logger.info(f"Dataset '{self.dataset_id}' created successfully.")
            else:
                raise

    def get_schema(self) -> list:
        """Define the schema for analytics.postgres_test2."""
        if bigquery and hasattr(bigquery, "SchemaField"):
            return [
                bigquery.SchemaField("id", "STRING", mode="REQUIRED", description="Unique record identifier"),
                bigquery.SchemaField("name", "STRING", mode="NULLABLE", description="Cleaned name"),
                bigquery.SchemaField("age", "INT64", mode="NULLABLE", description="User age"),
                bigquery.SchemaField("email", "STRING", mode="NULLABLE", description="Cleaned email address"),
                bigquery.SchemaField("created_at", "TIMESTAMP", mode="NULLABLE", description="Record creation timestamp"),
                bigquery.SchemaField("_extracted_at", "TIMESTAMP", mode="REQUIRED", description="ETL extraction timestamp"),
            ]
        return [
            {"name": "id", "type": "STRING", "mode": "REQUIRED", "description": "Unique record identifier"},
            {"name": "name", "type": "STRING", "mode": "NULLABLE", "description": "Cleaned name"},
            {"name": "age", "type": "INT64", "mode": "NULLABLE", "description": "User age"},
            {"name": "email", "type": "STRING", "mode": "NULLABLE", "description": "Cleaned email address"},
            {"name": "created_at", "type": "TIMESTAMP", "mode": "NULLABLE", "description": "Record creation timestamp"},
            {"name": "_extracted_at", "type": "TIMESTAMP", "mode": "REQUIRED", "description": "ETL extraction timestamp"},
        ]

    def ensure_table_exists(self) -> None:
        """Create BigQuery table with partitioning and clustering if it does not exist."""
        self.ensure_dataset_exists()
        try:
            self.client.get_table(self.table_id)
            logger.info(f"Table '{self.table_id}' exists.")
        except Exception as e:
            if "NotFound" in type(e).__name__ or (NotFound and isinstance(e, NotFound)):
                logger.info(f"Table '{self.table_id}' not found. Creating table...")
                if bigquery and hasattr(bigquery, "Table"):
                    table = bigquery.Table(self.table_id, schema=self.get_schema())
                    if hasattr(bigquery, "TimePartitioning"):
                        table.time_partitioning = bigquery.TimePartitioning(
                            type_=bigquery.TimePartitioningType.DAY,
                            field="_extracted_at",
                        )
                    table.clustering_fields = ["id"]
                    self.client.create_table(table, exists_ok=True)
                else:
                    self.client.create_table(self.table_id, exists_ok=True)
                logger.info(f"Table '{self.table_id}' created successfully.")
            else:
                raise

    def load(self, df: object, write_disposition: str = "WRITE_TRUNCATE") -> int:
        """Load DataFrame into BigQuery table idempotently."""
        self.ensure_table_exists()

        if hasattr(df, "empty") and df.empty:
            logger.info("DataFrame is empty. Skipping table write.")
            return 0

        row_count = len(df) if hasattr(df, "__len__") else 0
        logger.info(f"Loading {row_count} rows into '{self.table_id}' with write disposition '{write_disposition}'...")
        if bigquery and hasattr(bigquery, "LoadJobConfig"):
            job_config = bigquery.LoadJobConfig(
                schema=self.get_schema(),
                write_disposition=write_disposition,
            )
        else:
            job_config = {"write_disposition": write_disposition}

        job = self.client.load_table_from_dataframe(
            df,
            self.table_id,
            job_config=job_config,
        )
        job.result()  # Wait for the load job to complete

        table = self.client.get_table(self.table_id)
        num_rows = getattr(table, "num_rows", row_count)
        logger.info(f"Load job complete. Table '{self.table_id}' now has {num_rows} total rows.")
        return row_count
