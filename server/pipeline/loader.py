"""Google Cloud BigQuery loader module."""
import logging
import time
from typing import Any, Dict, List, Optional, Set
from google.cloud import bigquery
from google.api_core.exceptions import GoogleAPIError
from server.models import SalesOrderClean

logger = logging.getLogger(__name__)

BQ_SCHEMA = [
    bigquery.SchemaField("order_id", "STRING", mode="REQUIRED", description="Unique sales order identifier"),
    bigquery.SchemaField("customer_id", "STRING", mode="NULLABLE", description="Identifier for customer"),
    bigquery.SchemaField("customer_name", "STRING", mode="NULLABLE", description="Customer full name"),
    bigquery.SchemaField("customer_email", "STRING", mode="REQUIRED", description="Validated customer email address"),
    bigquery.SchemaField("order_date", "DATE", mode="REQUIRED", description="Transaction date - Partitioning Column"),
    bigquery.SchemaField("amount", "NUMERIC", mode="REQUIRED", description="Cleaned transaction sales amount"),
    bigquery.SchemaField("currency", "STRING", mode="NULLABLE", description="Transaction currency code (e.g., USD)"),
    bigquery.SchemaField("status", "STRING", mode="NULLABLE", description="Order status"),
    bigquery.SchemaField("extracted_at", "TIMESTAMP", mode="REQUIRED", description="Timestamp when record was extracted from PostgreSQL"),
    bigquery.SchemaField("loaded_at", "TIMESTAMP", mode="REQUIRED", description="Timestamp when record was loaded into BigQuery"),
]


class BigQueryLoader:
    """Loads cleaned sales order records into Google Cloud BigQuery partitioned table."""

    def __init__(
        self,
        project_id: Optional[str] = None,
        dataset_id: str = "dev_sales",
        table_id: str = "fct_sales_orders_v1",
        client: Optional[bigquery.Client] = None,
        max_retries: int = 3,
        retry_delay: float = 2.0,
    ):
        self.project_id = project_id
        self.dataset_id = dataset_id
        self.table_id = table_id
        self.max_retries = max_retries
        self.retry_delay = retry_delay

        if client is not None:
            self.client = client
        elif project_id:
            self.client = bigquery.Client(project=project_id)
        else:
            self.client = bigquery.Client()

        self.full_table_ref = f"{self.client.project}.{self.dataset_id}.{self.table_id}"

    def ensure_table_exists(self) -> bigquery.Table:
        """Ensure dataset and partitioned target table exist in BigQuery."""
        dataset_ref = bigquery.DatasetReference(self.client.project, self.dataset_id)
        try:
            self.client.get_dataset(dataset_ref)
        except Exception:
            logger.info(f"Dataset '{self.dataset_id}' not found. Creating dataset...")
            dataset = bigquery.Dataset(dataset_ref)
            dataset.location = "US"
            self.client.create_dataset(dataset, exists_ok=True)

        table_ref = dataset_ref.table(self.table_id)
        try:
            return self.client.get_table(table_ref)
        except Exception:
            logger.info(f"Target table '{self.full_table_ref}' not found. Creating partitioned table...")
            table = bigquery.Table(table_ref, schema=BQ_SCHEMA)
            table.time_partitioning = bigquery.TimePartitioning(
                type_=bigquery.TimePartitioningType.DAY,
                field="order_date",
            )
            table.clustering_fields = ["customer_id", "status"]
            table.description = "Fact table containing cleaned sales orders, partitioned daily by order_date"
            return self.client.create_table(table, exists_ok=True)

    def format_records_for_bq(self, records: List[SalesOrderClean]) -> List[Dict[str, Any]]:
        """Serialize SalesOrderClean objects into BigQuery JSON load format."""
        formatted = []
        for r in records:
            formatted.append({
                "order_id": r.order_id,
                "customer_id": r.customer_id,
                "customer_name": r.customer_name,
                "customer_email": r.customer_email,
                "order_date": r.order_date.isoformat(),
                "amount": float(r.amount),
                "currency": r.currency,
                "status": r.status,
                "extracted_at": r.extracted_at.isoformat(),
                "loaded_at": r.loaded_at.isoformat(),
            })
        return formatted

    def load_records(self, records: List[SalesOrderClean], write_disposition: str = "WRITE_APPEND") -> Dict[str, Any]:
        """Execute BigQuery batch load job with partitioned ingestion and retry policy."""
        if not records:
            logger.info("No records to load into BigQuery.")
            return {
                "records_loaded": 0,
                "affected_partitions": [],
                "status": "SUCCESS",
            }

        self.ensure_table_exists()

        bq_rows = self.format_records_for_bq(records)
        affected_partitions: Set[str] = {r.order_date.isoformat() for r in records}

        job_config = bigquery.LoadJobConfig(
            schema=BQ_SCHEMA,
            write_disposition=write_disposition,
            source_format=bigquery.SourceFormat.NEWLINE_DELIMITED_JSON,
        )

        attempt = 0
        last_error = None
        while attempt < self.max_retries:
            attempt += 1
            try:
                logger.info(f"Submitting BigQuery load job to '{self.full_table_ref}' with {len(bq_rows)} rows (attempt {attempt}/{self.max_retries})...")
                load_job = self.client.load_table_from_json(
                    bq_rows,
                    self.full_table_ref,
                    job_config=job_config,
                )
                load_job.result()  # Waits for job to complete.

                if load_job.errors:
                    raise RuntimeError(f"BigQuery load job encountered errors: {load_job.errors}")

                logger.info(f"Successfully loaded {len(bq_rows)} records into BigQuery table '{self.full_table_ref}'.")
                return {
                    "records_loaded": len(bq_rows),
                    "affected_partitions": sorted(list(affected_partitions)),
                    "status": "SUCCESS",
                    "job_id": getattr(load_job, "job_id", "local_job"),
                }
            except (GoogleAPIError, Exception) as exc:
                last_error = exc
                logger.warning(f"BigQuery load attempt {attempt} failed: {exc}")
                if attempt < self.max_retries:
                    time.sleep(self.retry_delay * (2 ** (attempt - 1)))

        logger.error(f"Failed to load records into BigQuery table '{self.full_table_ref}' after {self.max_retries} attempts.")
        raise RuntimeError(f"BigQuery load failed: {last_error}") from last_error
