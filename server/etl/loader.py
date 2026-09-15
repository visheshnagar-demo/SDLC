"""BigQuery loader module."""
import logging
import os
from typing import Any, Dict, List, Optional
from server.config import settings

logger = logging.getLogger("server.etl.loader")


class BigQueryLoader:
    """Loads transformed records into BigQuery target table partitioned by order_date."""

    def __init__(
        self,
        project_id: Optional[str] = None,
        dataset_id: Optional[str] = None,
        table_id: Optional[str] = None,
        client: Optional[Any] = None,
    ):
        self.project_id = project_id or settings.GCP_PROJECT_ID
        self.dataset_id = dataset_id or settings.BIGQUERY_DATASET
        self.table_id = table_id or settings.BIGQUERY_TABLE
        self.client = client

    def _get_client(self) -> Any:
        if self.client is not None:
            return self.client
        if not self.project_id:
            raise EnvironmentError("GCP_PROJECT_ID is not configured for BigQuery loading.")
        try:
            from google.cloud import bigquery
            self.client = bigquery.Client(project=self.project_id)
            return self.client
        except Exception as exc:
            raise RuntimeError(f"Failed to initialize BigQuery client: {exc}") from exc

    def ensure_table_exists(self) -> None:
        """Verifies or creates dataset and table with DAY partitioning on order_date."""
        client = self._get_client()
        from google.cloud import bigquery

        dataset_ref = f"{self.project_id}.{self.dataset_id}"
        table_ref = f"{dataset_ref}.{self.table_id}"

        # Create dataset if not exists
        try:
            client.get_dataset(dataset_ref)
        except Exception:
            dataset = bigquery.Dataset(dataset_ref)
            dataset.location = "US"
            client.create_dataset(dataset, exists_ok=True)
            logger.info("Created dataset %s", dataset_ref)

        # Create partitioned table if not exists
        schema = [
            bigquery.SchemaField("order_id", "STRING", mode="REQUIRED"),
            bigquery.SchemaField("customer_email", "STRING", mode="REQUIRED"),
            bigquery.SchemaField("amount", "NUMERIC", mode="REQUIRED"),
            bigquery.SchemaField("order_date", "DATE", mode="REQUIRED"),
            bigquery.SchemaField("ingestion_timestamp", "TIMESTAMP", mode="REQUIRED"),
            bigquery.SchemaField("pipeline_run_id", "STRING", mode="REQUIRED"),
        ]
        table = bigquery.Table(table_ref, schema=schema)
        table.time_partitioning = bigquery.TimePartitioning(
            type_=bigquery.TimePartitioningType.DAY,
            field="order_date",
        )
        table.clustering_fields = ["order_id"]
        try:
            client.create_table(table, exists_ok=True)
            logger.info("Ensured BigQuery table %s exists with DAY partition on order_date.", table_ref)
        except Exception as exc:
            logger.error("Error creating/checking table %s: %s", table_ref, exc)
            raise

    def load_records(self, records: List[Dict[str, Any]]) -> int:
        """Loads records into BigQuery using insert_rows_json."""
        if not records:
            logger.info("No records to load.")
            return 0

        client = self._get_client()
        table_ref = f"{self.project_id}.{self.dataset_id}.{self.table_id}"
        logger.info("Loading %d records into BigQuery table %s...", len(records), table_ref)

        errors = client.insert_rows_json(table_ref, records)
        if errors:
            raise RuntimeError(f"BigQuery load failed with errors: {errors}")

        logger.info("Successfully loaded %d records into %s.", len(records), table_ref)
        return len(records)
