"""BigQuery writer module for loading processed sales data into partitioned tables."""
import logging
from typing import Optional
import pandas as pd
from google.cloud import bigquery
from google.cloud.exceptions import NotFound

logger = logging.getLogger(__name__)

SALES_ORDER_BQ_SCHEMA = [
    bigquery.SchemaField("order_id", "INTEGER", mode="REQUIRED", description="Unique sales order identifier"),
    bigquery.SchemaField("customer_id", "STRING", mode="NULLABLE", description="Unique customer identifier"),
    bigquery.SchemaField("customer_name", "STRING", mode="NULLABLE", description="Customer full name"),
    bigquery.SchemaField("customer_email", "STRING", mode="NULLABLE", description="Customer email address"),
    bigquery.SchemaField("product_category", "STRING", mode="NULLABLE", description="Product category"),
    bigquery.SchemaField("amount", "FLOAT", mode="NULLABLE", description="Sales order amount"),
    bigquery.SchemaField("currency", "STRING", mode="NULLABLE", description="Currency code"),
    bigquery.SchemaField("order_status", "STRING", mode="NULLABLE", description="Status of the order"),
    bigquery.SchemaField("created_at", "TIMESTAMP", mode="NULLABLE", description="Timestamp when the order was created"),
    bigquery.SchemaField("order_date", "DATE", mode="REQUIRED", description="Date of the order derived from created_at"),
    bigquery.SchemaField("ingested_at", "TIMESTAMP", mode="REQUIRED", description="UTC timestamp when record was ingested by ETL"),
]


class BigQueryWriter:
    """Writes transformed dataframes to BigQuery partitioned tables."""

    def __init__(self, client: Optional[bigquery.Client] = None, project_id: Optional[str] = None):
        """Initialize BigQuery writer."""
        self.client = client or bigquery.Client(project=project_id)
        self.project_id = project_id or (self.client.project if self.client else None)

    def ensure_dataset_exists(self, dataset_id: str, location: str = "us-central1") -> bigquery.Dataset:
        """Ensures the target BigQuery dataset exists, creating it if necessary."""
        dataset_ref = bigquery.DatasetReference(self.project_id, dataset_id)
        try:
            dataset = self.client.get_dataset(dataset_ref)
            logger.info("Dataset '%s' exists.", dataset_id)
            return dataset
        except NotFound:
            logger.info("Dataset '%s' not found. Creating in location '%s'...", dataset_id, location)
            dataset = bigquery.Dataset(dataset_ref)
            dataset.location = location
            return self.client.create_dataset(dataset, exists_ok=True)

    def write_dataframe(
        self,
        df: pd.DataFrame,
        dataset_id: str,
        table_id: str,
        partition_field: str = "order_date",
        write_disposition: str = bigquery.WriteDisposition.WRITE_APPEND,
    ) -> int:
        """Loads a DataFrame into a partitioned BigQuery table.

        Args:
            df: Transformed DataFrame to load
            dataset_id: Target BigQuery dataset ID
            table_id: Target BigQuery table ID
            partition_field: Column name to partition by (DATE or TIMESTAMP)
            write_disposition: BigQuery write disposition (default WRITE_APPEND)

        Returns:
            int: Number of rows loaded

        Raises:
            ValueError: If dataframe is empty or missing partition column
            RuntimeError: If load job fails
        """
        if df.empty:
            logger.warning("Empty DataFrame provided to BigQueryWriter. 0 rows loaded.")
            return 0

        if partition_field not in df.columns:
            raise ValueError(f"Partition field '{partition_field}' not present in DataFrame.")

        self.ensure_dataset_exists(dataset_id)

        table_ref = f"{self.project_id}.{dataset_id}.{table_id}" if self.project_id else f"{dataset_id}.{table_id}"
        logger.info("Starting BigQuery load job to '%s' with %d rows", table_ref, len(df))

        job_config = bigquery.LoadJobConfig(
            schema=SALES_ORDER_BQ_SCHEMA,
            write_disposition=write_disposition,
            time_partitioning=bigquery.TimePartitioning(
                type_=bigquery.TimePartitioningType.DAY,
                field=partition_field,
            ),
        )

        load_job = self.client.load_table_from_dataframe(df, table_ref, job_config=job_config)
        load_job.result()  # Wait for the job to complete

        if load_job.errors:
            raise RuntimeError(f"BigQuery load job failed with errors: {load_job.errors}")

        loaded_rows = load_job.output_rows or len(df)
        logger.info("Successfully loaded %d rows into BigQuery table '%s'", loaded_rows, table_ref)
        return loaded_rows
