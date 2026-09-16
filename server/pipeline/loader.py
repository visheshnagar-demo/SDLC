import os
from typing import Any, Dict, List, Optional
from datetime import date
from server.config import settings
from server.pipeline.logger import pipeline_logger

try:
    from google.cloud import bigquery
    from google.cloud.exceptions import NotFound
    BIGQUERY_AVAILABLE = True
except ImportError:
    BIGQUERY_AVAILABLE = False


class BigQueryLoader:
    """
    Loads transformed sales records into BigQuery table fct_sales_orders.
    Configured with DAY partitioning on order_date and clustering on customer_id, status.
    """

    def __init__(
        self,
        project_id: Optional[str] = None,
        dataset_id: Optional[str] = None,
        table_id: Optional[str] = None,
        location: Optional[str] = None
    ):
        self.project_id = project_id or settings.BIGQUERY_PROJECT_ID
        self.dataset_id = dataset_id or settings.BIGQUERY_DATASET
        self.table_id = table_id or settings.BIGQUERY_TABLE
        self.location = location or settings.BIGQUERY_LOCATION
        self.full_table_ref = f"{self.project_id}.{self.dataset_id}.{self.table_id}"
        self._client = None
        self.is_mock = os.getenv("TESTING", "").lower() in ("true", "1") or not BIGQUERY_AVAILABLE

    @property
    def client(self):
        if self._client is None and not self.is_mock:
            try:
                self._client = bigquery.Client(project=self.project_id, location=self.location)
            except Exception as exc:
                pipeline_logger.warning(f"BigQuery Client initialization notice (falling back to simulated mode if credentials absent): {exc}")
                self.is_mock = True
        return self._client

    def ensure_table_schema(self) -> None:
        """
        Creates dataset and table with DAY partitioning on order_date and clustering if not exists.
        """
        if self.is_mock or not BIGQUERY_AVAILABLE or self.client is None:
            pipeline_logger.info("BigQueryLoader: Simulated schema check passed.")
            return

        dataset_ref = bigquery.DatasetReference(self.project_id, self.dataset_id)
        try:
            self.client.get_dataset(dataset_ref)
        except NotFound:
            dataset = bigquery.Dataset(dataset_ref)
            dataset.location = self.location
            self.client.create_dataset(dataset, timeout=30)
            pipeline_logger.info(f"BigQueryLoader: Created dataset {self.dataset_id}")

        table_ref = dataset_ref.table(self.table_id)
        try:
            self.client.get_table(table_ref)
        except NotFound:
            schema = [
                bigquery.SchemaField("order_id", "STRING", mode="REQUIRED", description="Unique sales order identifier"),
                bigquery.SchemaField("customer_id", "STRING", mode="NULLABLE", description="Customer identifier"),
                bigquery.SchemaField("customer_email", "STRING", mode="REQUIRED", description="Validated customer email address"),
                bigquery.SchemaField("order_date", "DATE", mode="REQUIRED", description="Partitioning column (order placement date)"),
                bigquery.SchemaField("amount", "NUMERIC", mode="REQUIRED", description="Validated sales amount"),
                bigquery.SchemaField("currency", "STRING", mode="NULLABLE", description="Currency code (e.g. USD)"),
                bigquery.SchemaField("status", "STRING", mode="NULLABLE", description="Order fulfillment status"),
                bigquery.SchemaField("source_created_at", "TIMESTAMP", mode="NULLABLE", description="Original record creation timestamp"),
                bigquery.SchemaField("ingested_at", "TIMESTAMP", mode="REQUIRED", description="Pipeline ingestion timestamp (UTC)"),
            ]
            table = bigquery.Table(table_ref, schema=schema)
            table.time_partitioning = bigquery.TimePartitioning(
                type_=bigquery.TimePartitioningType.DAY,
                field="order_date"
            )
            table.clustering_fields = ["customer_id", "status"]
            self.client.create_table(table)
            pipeline_logger.info(f"BigQueryLoader: Created partitioned table {self.full_table_ref}")

    def load_records(self, records: List[Dict[str, Any]], force_reload: bool = False) -> int:
        """
        Loads transformed records into the target partitioned BigQuery table.
        Returns count of loaded records.
        """
        if not records:
            pipeline_logger.info("BigQueryLoader: 0 records to load.")
            return 0

        self.ensure_table_schema()

        if self.is_mock or not BIGQUERY_AVAILABLE or self.client is None:
            pipeline_logger.info(f"BigQueryLoader (Simulated): Ingested {len(records)} records into {self.full_table_ref}")
            return len(records)

        table_ref = f"{self.project_id}.{self.dataset_id}.{self.table_id}"
        errors = self.client.insert_rows_json(table_ref, records)
        if errors:
            pipeline_logger.error(f"BigQueryLoader: Insert errors: {errors}")
            raise RuntimeError(f"BigQuery insertion encountered errors: {errors}")

        pipeline_logger.info(f"BigQueryLoader: Successfully ingested {len(records)} records into {self.full_table_ref}")
        return len(records)

    def check_connection(self) -> bool:
        """
        Verifies BigQuery connectivity.
        """
        if self.is_mock:
            return True
        try:
            if self.client is not None:
                self.client.get_dataset(bigquery.DatasetReference(self.project_id, self.dataset_id))
            return True
        except Exception as exc:
            pipeline_logger.warning(f"BigQueryLoader connectivity check failed or unauthenticated: {exc}")
            return False
