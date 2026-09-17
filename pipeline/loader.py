"""BigQuery Partitioned Destination Loader Engine."""
import os
import logging
import pandas as pd
from google.cloud import bigquery

logger = logging.getLogger(__name__)

DEFAULT_DATASET = "analytics"
DEFAULT_TABLE = "new_sales_orders"

SCHEMA = [
    bigquery.SchemaField("order_id", "STRING", mode="REQUIRED", description="Cleaned unique order identifier"),
    bigquery.SchemaField("customer_id", "STRING", mode="REQUIRED", description="Normalized customer identifier"),
    bigquery.SchemaField("order_date", "DATE", mode="REQUIRED", description="Order date (partitioning column)"),
    bigquery.SchemaField("product_id", "STRING", mode="REQUIRED", description="Product SKU identifier"),
    bigquery.SchemaField("quantity", "INT64", mode="REQUIRED", description="Quantity of items purchased"),
    bigquery.SchemaField("amount", "NUMERIC", mode="REQUIRED", description="Total transaction monetary amount"),
    bigquery.SchemaField("status", "STRING", mode="NULLABLE", description="Standardized fulfillment status"),
    bigquery.SchemaField("ingested_at", "TIMESTAMP", mode="REQUIRED", description="UTC timestamp when record was loaded by ETL"),
]

class BigQuerySalesLoader:
    def __init__(self, dataset_id: str = None, table_id: str = None, project_id: str = None):
        self.project_id = project_id or os.getenv("GCP_PROJECT_ID", os.getenv("PROJECT_ID"))
        self.dataset_id = dataset_id or os.getenv("BIGQUERY_DATASET", DEFAULT_DATASET)
        self.table_id = table_id or os.getenv("BIGQUERY_TABLE", DEFAULT_TABLE)

    def load(self, df: pd.DataFrame) -> int:
        if df is None or df.empty:
            logger.info("No records to load into BigQuery.")
            return 0
        client = bigquery.Client(project=self.project_id)
        table_ref = f"{self.project_id}.{self.dataset_id}.{self.table_id}" if self.project_id else f"{self.dataset_id}.{self.table_id}"
        table = bigquery.Table(table_ref, schema=SCHEMA)
        table.time_partitioning = bigquery.TimePartitioning(
            type_=bigquery.TimePartitioningType.DAY,
            field="order_date",
        )
        table.clustering_fields = ["customer_id", "product_id"]
        table = client.create_table(table, exists_ok=True)
        job_config = bigquery.LoadJobConfig(
            schema=SCHEMA,
            write_disposition=bigquery.WriteDisposition.WRITE_APPEND,
            time_partitioning=bigquery.TimePartitioning(type_=bigquery.TimePartitioningType.DAY, field="order_date"),
            clustering_fields=["customer_id", "product_id"],
        )
        job = client.load_table_from_dataframe(df, table_ref, job_config=job_config)
        job.result()
        if job.errors:
            raise RuntimeError(f"BigQuery load job failed: {job.errors}")
        logger.info("Successfully loaded %d records into %s", len(df), table_ref)
        return len(df)

def load_sales_data(df: pd.DataFrame, dataset_id: str = None, table_id: str = None) -> int:
    return BigQuerySalesLoader(dataset_id, table_id).load(df)
