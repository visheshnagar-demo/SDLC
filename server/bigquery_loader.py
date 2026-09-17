"""BigQuery Loader Module for Sales Order ETL Pipeline.

Manages BigQuery dataset and table initialization with date partitioning,
clustering, and idempotent batch loading via BigQuery Load Jobs.
"""

import logging
from decimal import Decimal
from typing import Optional
from google.cloud import bigquery
from google.cloud.exceptions import GoogleCloudError
import pandas as pd

logger = logging.getLogger("sales_order_etl.loader")

SCHEMA_DEFINITIONS = [
    bigquery.SchemaField("order_id", "STRING", mode="REQUIRED", description="Unique sales order identifier"),
    bigquery.SchemaField("order_date", "DATE", mode="REQUIRED", description="Date of order placement (partition key)"),
    bigquery.SchemaField("customer_id", "STRING", mode="NULLABLE", description="Customer reference identifier"),
    bigquery.SchemaField("customer_name", "STRING", mode="NULLABLE", description="Customer full name"),
    bigquery.SchemaField("customer_email", "STRING", mode="NULLABLE", description="Customer contact email"),
    bigquery.SchemaField("product_category", "STRING", mode="NULLABLE", description="Product category identifier"),
    bigquery.SchemaField("amount", "NUMERIC", mode="NULLABLE", description="Order total monetary amount"),
    bigquery.SchemaField("currency", "STRING", mode="NULLABLE", description="Three-letter ISO currency code"),
    bigquery.SchemaField("order_status", "STRING", mode="NULLABLE", description="Status of order fulfillment"),
    bigquery.SchemaField("created_at", "TIMESTAMP", mode="NULLABLE", description="Original order creation timestamp in UTC"),
    bigquery.SchemaField("ingestion_timestamp", "TIMESTAMP", mode="REQUIRED", description="Timestamp when record was processed by ETL"),
]


class BigQueryLoader:
    """Loader client for BigQuery target warehouse."""

    def __init__(
        self,
        project_id: str,
        dataset_id: str = "analytics",
        table_id: str = "new_sales_orders",
        bq_client: Optional[bigquery.Client] = None,
    ):
        """Initializes the BigQuery loader.

        Args:
            project_id: Google Cloud Project ID.
            dataset_id: Destination BigQuery dataset name.
            table_id: Destination BigQuery table name.
            bq_client: Optional injected BigQuery Client for testing.
        """
        self.project_id = project_id
        self.dataset_id = dataset_id
        self.table_id = table_id
        self._client = bq_client

    @property
    def client(self) -> bigquery.Client:
        """Lazy-loaded BigQuery client."""
        if self._client is None:
            self._client = bigquery.Client(project=self.project_id)
        return self._client

    @property
    def table_ref(self) -> str:
        """Returns fully qualified target table ID."""
        return f"{self.project_id}.{self.dataset_id}.{self.table_id}"

    def ensure_table_exists(self) -> bigquery.Table:
        """Verifies or creates dataset and partitioned BigQuery table."""
        # 1. Ensure Dataset Exists
        dataset_ref = bigquery.DatasetReference(self.project_id, self.dataset_id)
        try:
            dataset = bigquery.Dataset(dataset_ref)
            dataset.location = "US"
            self.client.create_dataset(dataset, exists_ok=True)
            logger.info(
                "Ensured dataset exists",
                extra={"event": "DATASET_VERIFIED", "dataset": self.dataset_id},
            )
        except Exception as err:
            logger.error(
                "Failed to verify/create dataset",
                extra={"event": "DATASET_ERROR", "dataset": self.dataset_id, "error": str(err)},
            )
            raise

        # 2. Ensure Partitioned & Clustered Table Exists
        table = bigquery.Table(self.table_ref, schema=SCHEMA_DEFINITIONS)
        table.time_partitioning = bigquery.TimePartitioning(
            type_=bigquery.TimePartitioningType.DAY,
            field="order_date",
        )
        table.clustering_fields = ["customer_id", "order_status"]
        table.description = "Partitioned and clustered sales orders dataset loaded from GCS batch pipeline"

        try:
            created_table = self.client.create_table(table, exists_ok=True)
            logger.info(
                "Ensured partitioned target table exists",
                extra={
                    "event": "TABLE_VERIFIED",
                    "table": self.table_ref,
                    "partition_field": "order_date",
                    "clustering_fields": ["customer_id", "order_status"],
                },
            )
            return created_table
        except Exception as err:
            logger.error(
                "Failed to verify/create table",
                extra={"event": "TABLE_ERROR", "table": self.table_ref, "error": str(err)},
            )
            raise

    def load_dataframe(
        self,
        df: pd.DataFrame,
        write_disposition: str = "WRITE_APPEND",
    ) -> int:
        """Loads a pandas DataFrame into the target BigQuery table.

        Args:
            df: Cleaned and transformed pandas DataFrame.
            write_disposition: BigQuery write mode ('WRITE_APPEND' or 'WRITE_TRUNCATE').

        Returns:
            Count of rows loaded.

        Raises:
            RuntimeError: If BigQuery load job fails.
        """
        if df is None or df.empty:
            logger.info(
                "No records to load into BigQuery",
                extra={"event": "LOAD_SKIPPED_EMPTY_DATA"},
            )
            return 0

        self.ensure_table_exists()

        job_config = bigquery.LoadJobConfig(
            schema=SCHEMA_DEFINITIONS,
            write_disposition=write_disposition,
            time_partitioning=bigquery.TimePartitioning(
                type_=bigquery.TimePartitioningType.DAY,
                field="order_date",
            ),
            clustering_fields=["customer_id", "order_status"],
        )

        logger.info(
            "Initiating BigQuery batch load job",
            extra={
                "event": "LOAD_JOB_START",
                "table": self.table_ref,
                "rows_to_load": len(df),
                "write_disposition": write_disposition,
            },
        )

        try:
            # Convert float64 columns to Decimal to match BigQuery NUMERIC
            # (16-byte fixed-precision). Without this, PyArrow serializes
            # float64 as 8-byte DOUBLE, causing:
            #   "Got bytestring of length 8 (expected 16)"
            for col in df.select_dtypes(include=["float64", "float32"]).columns:
                df[col] = df[col].apply(
                    lambda x: Decimal(str(round(x, 9))) if pd.notna(x) else None
                )

            job = self.client.load_table_from_dataframe(
                df,
                self.table_ref,
                job_config=job_config,
            )
            job.result()  # Wait for job to complete

            logger.info(
                "BigQuery batch load completed successfully",
                extra={
                    "event": "LOAD_JOB_SUCCESS",
                    "table": self.table_ref,
                    "rows_loaded": len(df),
                    "job_id": job.job_id,
                },
            )
            return len(df)

        except GoogleCloudError as gcp_err:
            logger.error(
                "BigQuery load job encountered GCP error",
                extra={"event": "LOAD_JOB_GCP_ERROR", "error": str(gcp_err)},
            )
            raise RuntimeError(f"BigQuery load job failed: {gcp_err}") from gcp_err
        except Exception as err:
            logger.error(
                "Unexpected error during BigQuery load job",
                extra={"event": "LOAD_JOB_ERROR", "error": str(err)},
            )
            raise RuntimeError(f"Unexpected error loading to BigQuery: {err}") from err
