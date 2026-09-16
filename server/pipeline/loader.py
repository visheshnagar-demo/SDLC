"""BigQuery Loader module for loading cleaned sales data into partitioned tables."""
import os
import logging
from typing import Any

try:
    import pandas as pd
except ImportError:
    pd = None

logger = logging.getLogger("server.pipeline.loader")


class BigQueryLoader:
    """Loads validated sales records into BigQuery table partitioned by order_date."""

    def __init__(
        self,
        dataset_id: str = "dev_sales",
        table_id: str = "fct_sales_orders_v1",
        write_mode: str = "append",
    ):
        self.dataset_id = dataset_id
        self.table_id = table_id
        self.write_mode = write_mode

    def load(self, data: Any) -> bool:
        if data is None or (hasattr(data, "__len__") and len(data) == 0):
            logger.warning("No clean records to load into BigQuery. Skipping load phase.")
            return True

        project_id = os.getenv("GCP_PROJECT_ID") or os.getenv("PROJECT_ID")
        if not project_id:
            raise EnvironmentError(
                "FATAL: GCP_PROJECT_ID or PROJECT_ID must be set for BigQuery loading."
            )

        from google.cloud import bigquery

        client = bigquery.Client(project=project_id)
        table_ref = f"{project_id}.{self.dataset_id}.{self.table_id}"

        job_config = bigquery.LoadJobConfig(
            write_disposition=(
                bigquery.WriteDisposition.WRITE_APPEND
                if self.write_mode == "append"
                else bigquery.WriteDisposition.WRITE_TRUNCATE
            ),
            time_partitioning=bigquery.TimePartitioning(
                type_=bigquery.TimePartitioningType.DAY,
                field="order_date",
            ),
            clustering_fields=["customer_id", "status"],
            schema=[
                bigquery.SchemaField(
                    "order_id", "STRING", mode="REQUIRED", description="Unique sales order identifier"
                ),
                bigquery.SchemaField(
                    "customer_id", "STRING", mode="NULLABLE", description="Identifier for customer"
                ),
                bigquery.SchemaField(
                    "customer_name", "STRING", mode="NULLABLE", description="Customer full name"
                ),
                bigquery.SchemaField(
                    "customer_email",
                    "STRING",
                    mode="REQUIRED",
                    description="Validated customer email address",
                ),
                bigquery.SchemaField(
                    "order_date",
                    "DATE",
                    mode="REQUIRED",
                    description="Transaction date - Partitioning Column",
                ),
                bigquery.SchemaField(
                    "amount", "NUMERIC", mode="REQUIRED", description="Cleaned transaction sales amount"
                ),
                bigquery.SchemaField(
                    "currency",
                    "STRING",
                    mode="NULLABLE",
                    description="Transaction currency code (e.g., USD)",
                ),
                bigquery.SchemaField("status", "STRING", mode="NULLABLE", description="Order status"),
                bigquery.SchemaField(
                    "extracted_at",
                    "TIMESTAMP",
                    mode="NULLABLE",
                    description="Timestamp when record was extracted from PostgreSQL",
                ),
                bigquery.SchemaField(
                    "loaded_at",
                    "TIMESTAMP",
                    mode="NULLABLE",
                    description="Timestamp when record was loaded into BigQuery",
                ),
            ],
        )

        row_count = len(data)
        logger.info("Starting BigQuery load job into %s (%d rows)...", table_ref, row_count)
        if pd is not None and isinstance(data, pd.DataFrame):
            job = client.load_table_from_dataframe(data, table_ref, job_config=job_config)
        else:
            job = client.load_table_from_json(data, table_ref, job_config=job_config)
        job.result()  # Wait for job completion

        if job.errors:
            raise RuntimeError(f"FATAL: BigQuery load job failed: {job.errors}")

        logger.info("Successfully loaded %d records into BigQuery table: %s", row_count, table_ref)
        return True
