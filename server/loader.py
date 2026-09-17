"""BigQuery data loader module for partitioned and clustered sales orders."""

import json
import logging
from typing import Any, List, Optional
from server.models import SalesOrderRecord

try:
    from google.cloud import bigquery
    from google.cloud.exceptions import NotFound
except ImportError:
    bigquery = None

    class NotFound(Exception):
        pass

logger = logging.getLogger("sales_etl.loader")


def get_bigquery_schema():
    """Builds and returns the BigQuery schema definition."""
    if bigquery is None:
        return []
    return [
        bigquery.SchemaField("order_id", "STRING", mode="REQUIRED", description="Unique identifier for the sales order"),
        bigquery.SchemaField("customer_id", "STRING", mode="REQUIRED", description="Customer identifier"),
        bigquery.SchemaField("product_id", "STRING", mode="REQUIRED", description="Product SKU / Identifier"),
        bigquery.SchemaField("product_category", "STRING", mode="NULLABLE", description="Category of the purchased item"),
        bigquery.SchemaField("quantity", "INTEGER", mode="REQUIRED", description="Number of items purchased (> 0)"),
        bigquery.SchemaField("unit_price", "NUMERIC", mode="REQUIRED", description="Price per unit"),
        bigquery.SchemaField("total_amount", "NUMERIC", mode="REQUIRED", description="Total monetary value (quantity * unit_price)"),
        bigquery.SchemaField("order_status", "STRING", mode="REQUIRED", description="Order state (COMPLETED, PENDING, CANCELLED)"),
        bigquery.SchemaField("created_at", "TIMESTAMP", mode="REQUIRED", description="Order placement timestamp (Partition Key)"),
        bigquery.SchemaField("ingested_at", "TIMESTAMP", mode="REQUIRED", description="Pipeline batch ingestion timestamp (UTC)"),
        bigquery.SchemaField("batch_id", "STRING", mode="REQUIRED", description="Unique UUID representing the pipeline batch execution"),
    ]


class BigQueryLoader:
    """Loads transformed records into BigQuery."""

    def __init__(self, project_id: str, client: Any = None):
        """Initializes BigQuery Loader.

        Args:
            project_id: Target GCP Project ID.
            client: Optional BigQuery client instance.
        """
        self.project_id = project_id
        if client is not None:
            self.client = client
        elif bigquery is not None:
            self.client = bigquery.Client(project=project_id)
        else:
            self.client = None

    def ensure_table_exists(self, dataset_id: str, table_id: str) -> Any:
        """Ensures the destination dataset and partitioned/clustered table exist.

        Args:
            dataset_id: BigQuery dataset name (e.g., 'analytics').
            table_id: BigQuery table name (e.g., 'new_sales_orders').

        Returns:
            The BigQuery Table object.
        """
        if self.client is None:
            raise RuntimeError("BigQuery client is not initialized and google-cloud-bigquery is not installed.")

        dataset_ref = bigquery.DatasetReference(self.project_id, dataset_id)
        try:
            self.client.get_dataset(dataset_ref)
        except NotFound:
            logger.info(f"Dataset {dataset_id} not found. Creating dataset...")
            dataset = bigquery.Dataset(dataset_ref)
            dataset.location = "US"
            self.client.create_dataset(dataset, exists_ok=True)
            logger.info(f"Dataset {dataset_id} created successfully.")

        table_ref = dataset_ref.table(table_id)
        try:
            table = self.client.get_table(table_ref)
            logger.info(f"Target table {table_ref} exists.")
            return table
        except NotFound:
            logger.info(f"Table {table_ref} not found. Creating partitioned table...")
            table = bigquery.Table(table_ref, schema=get_bigquery_schema())
            table.time_partitioning = bigquery.TimePartitioning(
                type_=bigquery.TimePartitioningType.DAY,
                field="created_at",
            )
            table.clustering_fields = ["customer_id", "product_category"]
            created_table = self.client.create_table(table)
            logger.info(f"Created table {created_table.full_table_id} partitioned by created_at.")
            return created_table

    def load_records(self, records: List[SalesOrderRecord], dataset_id: str, table_id: str) -> int:
        """Loads sales records into BigQuery table.

        Args:
            records: List of validated SalesOrderRecord objects.
            dataset_id: Destination BigQuery dataset.
            table_id: Destination BigQuery table.

        Returns:
            Count of rows loaded into BigQuery.
        """
        if not records:
            logger.info("No records to load. Skipping BigQuery load job.")
            return 0

        if self.client is None:
            raise RuntimeError("BigQuery client is not initialized and google-cloud-bigquery is not installed.")

        self.ensure_table_exists(dataset_id, table_id)
        table_ref = bigquery.DatasetReference(self.project_id, dataset_id).table(table_id)

        rows_to_insert = []
        for r in records:
            row_dict = {
                "order_id": r.order_id,
                "customer_id": r.customer_id,
                "product_id": r.product_id,
                "product_category": r.product_category,
                "quantity": r.quantity,
                "unit_price": str(r.unit_price),
                "total_amount": str(r.total_amount),
                "order_status": r.order_status,
                "created_at": r.created_at.isoformat(),
                "ingested_at": r.ingested_at.isoformat(),
                "batch_id": r.batch_id,
            }
            rows_to_insert.append(row_dict)

        job_config = bigquery.LoadJobConfig(
            schema=get_bigquery_schema(),
            write_disposition=bigquery.WriteDisposition.WRITE_APPEND,
            source_format=bigquery.SourceFormat.NEWLINE_DELIMITED_JSON,
            time_partitioning=bigquery.TimePartitioning(
                type_=bigquery.TimePartitioningType.DAY,
                field="created_at",
            ),
            clustering_fields=["customer_id", "product_category"],
        )

        logger.info(f"Submitting BigQuery load job for {len(rows_to_insert)} records to {table_ref}...")
        load_job = self.client.load_table_from_json(
            rows_to_insert,
            table_ref,
            job_config=job_config,
        )
        load_job.result()  # Wait for job completion

        if getattr(load_job, "errors", None):
            logger.error(f"BigQuery load job failed: {load_job.errors}")
            raise RuntimeError(f"BigQuery load job failed with errors: {load_job.errors}")

        output_rows = getattr(load_job, "output_rows", None) or len(rows_to_insert)
        logger.info(f"BigQuery load job completed successfully. Loaded {output_rows} rows.")
        return output_rows
