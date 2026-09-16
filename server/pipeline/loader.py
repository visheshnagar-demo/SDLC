"""BigQuery Loader module for loading partitioned and clustered sales order records."""
import logging
from typing import Optional
import pandas as pd
from google.cloud import bigquery
from google.cloud.exceptions import NotFound

logger = logging.getLogger("sales_orders_etl.loader")

BQ_SCHEMA = [
    bigquery.SchemaField("order_id", "STRING", mode="REQUIRED", description="Natural primary key of the sales order"),
    bigquery.SchemaField("customer_id", "STRING", mode="REQUIRED", description="Customer identifier"),
    bigquery.SchemaField("customer_name", "STRING", mode="NULLABLE", description="Customer full name"),
    bigquery.SchemaField("customer_email", "STRING", mode="NULLABLE", description="Customer email address"),
    bigquery.SchemaField("product_category", "STRING", mode="NULLABLE", description="Product category / classification"),
    bigquery.SchemaField("amount", "FLOAT64", mode="REQUIRED", description="Cleansed monetary value"),
    bigquery.SchemaField("currency", "STRING", mode="REQUIRED", description="ISO Currency Code"),
    bigquery.SchemaField("order_status", "STRING", mode="REQUIRED", description="Order processing status"),
    bigquery.SchemaField("created_at", "TIMESTAMP", mode="REQUIRED", description="Order creation timestamp (UTC)"),
    bigquery.SchemaField("ingested_at", "TIMESTAMP", mode="REQUIRED", description="ETL ingestion audit timestamp (UTC)"),
]


class BigQueryLoader:
    """Loads validated sales order DataFrames into Google Cloud BigQuery."""

    def __init__(
        self,
        project_id: str,
        dataset_id: str = "analytics",
        table_id: str = "sales_orders",
        client: Optional[bigquery.Client] = None,
        location: str = "us-central1",
    ):
        self.project_id = project_id
        self.dataset_id = dataset_id
        self.table_id = table_id
        self.location = location
        self._client = client

    @property
    def client(self) -> bigquery.Client:
        """Lazy initialization of BigQuery client."""
        if self._client is None:
            self._client = bigquery.Client(project=self.project_id)
        return self._client

    @property
    def full_table_id(self) -> str:
        """Returns the fully-qualified BigQuery table ID."""
        return f"{self.project_id}.{self.dataset_id}.{self.table_id}"

    def ensure_dataset_exists(self) -> None:
        """Ensures that the target dataset exists in BigQuery, creating it if missing."""
        dataset_ref = bigquery.DatasetReference(self.project_id, self.dataset_id)
        try:
            self.client.get_dataset(dataset_ref)
            logger.info(f"BigQuery dataset '{self.dataset_id}' exists.")
        except NotFound:
            logger.info(f"Dataset '{self.dataset_id}' not found. Creating in location '{self.location}'...")
            dataset = bigquery.Dataset(dataset_ref)
            dataset.location = self.location
            self.client.create_dataset(dataset, timeout=30)
            logger.info(f"Dataset '{self.dataset_id}' created successfully.")

    def ensure_table_exists(self) -> None:
        """Ensures the partitioned and clustered destination table exists."""
        self.ensure_dataset_exists()
        table_ref = bigquery.TableReference(
            bigquery.DatasetReference(self.project_id, self.dataset_id),
            self.table_id,
        )
        try:
            self.client.get_table(table_ref)
            logger.info(f"Destination table '{self.full_table_id}' exists.")
        except NotFound:
            logger.info(
                f"Creating table '{self.full_table_id}' with DAY partitioning on 'created_at' "
                f"and clustering on ['customer_id', 'order_status']..."
            )
            table = bigquery.Table(table_ref, schema=BQ_SCHEMA)
            
            # Configure daily time partitioning on created_at
            table.time_partitioning = bigquery.TimePartitioning(
                type_=bigquery.TimePartitioningType.DAY,
                field="created_at",
            )
            
            # Configure clustering on customer_id and order_status
            table.clustering_fields = ["customer_id", "order_status"]

            self.client.create_table(table, timeout=30)
            logger.info(f"Table '{self.full_table_id}' created successfully.")

    def load_dataframe(
        self, df: pd.DataFrame, write_disposition: str = "WRITE_APPEND"
    ) -> int:
        """Loads a DataFrame into BigQuery using load_table_from_dataframe.

        Args:
            df: Cleaned and deduplicated DataFrame.
            write_disposition: BigQuery write disposition ('WRITE_APPEND', 'WRITE_TRUNCATE', etc.).

        Returns:
            Number of rows loaded into BigQuery.

        Raises:
            RuntimeError: If the load job fails or reports errors.
        """
        if df.empty:
            logger.warning("Empty DataFrame provided to BigQueryLoader. No rows loaded.")
            return 0

        self.ensure_table_exists()

        job_config = bigquery.LoadJobConfig(
            schema=BQ_SCHEMA,
            write_disposition=write_disposition,
        )

        logger.info(f"Submitting BigQuery load job for {len(df)} records into '{self.full_table_id}'...")
        try:
            job = self.client.load_table_from_dataframe(
                df, self.full_table_id, job_config=job_config
            )
            job.result()  # Wait for the job to complete

            if job.errors:
                error_msg = f"BigQuery load job encountered errors: {job.errors}"
                logger.error(error_msg)
                raise RuntimeError(error_msg)

            output_rows = job.output_rows or len(df)
            logger.info(
                f"BigQuery load job {job.job_id} completed successfully. Loaded {output_rows} rows."
            )
            return output_rows

        except Exception as exc:
            error_msg = f"Failed to load data into BigQuery table '{self.full_table_id}'. Cause: {str(exc)}"
            logger.error(error_msg)
            raise RuntimeError(error_msg) from exc
