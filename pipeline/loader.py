"""Pipeline Loader Module.

Loads clean DataFrames or list records into target partitioned BigQuery table.
"""
import os
import json
from google.cloud import bigquery
from google.api_core import exceptions as google_exceptions
from pipeline.logger import get_logger

logger = get_logger("sales_etl.loader")


class BigQueryLoader:
    """Loads transformed records into BigQuery table."""

    def __init__(
        self,
        project_id: str = None,
        dataset_id: str = None,
        table_id: str = None,
    ):
        self.project_id = (
            project_id
            or os.getenv("GCP_PROJECT_ID")
            or os.getenv("PROJECT_ID")
            or os.getenv("GOOGLE_CLOUD_PROJECT")
            or os.getenv("GCLOUD_PROJECT")
        )
        self.dataset_id = dataset_id or os.getenv("BIGQUERY_DATASET") or "analytics"
        self.table_id = table_id or os.getenv("BIGQUERY_TABLE") or "harshada-test2"

    def load(self, data, write_mode: str = "append") -> int:
        """Loads dataset into BigQuery table with schema and partitioning."""
        if data is None or (hasattr(data, "empty") and data.empty) or (isinstance(data, list) and len(data) == 0):
            logger.warning("Empty dataset passed to BigQuery loader. Skipping load.")
            return 0

        if not self.project_id:
            raise EnvironmentError("FATAL: GCP_PROJECT_ID environment variable is not set.")

        table_ref = f"{self.project_id}.{self.dataset_id}.{self.table_id}"
        record_count = len(data)
        logger.info("Loading %d records into BigQuery table: %s", record_count, table_ref)

        client = bigquery.Client(project=self.project_id)

        # Ensure dataset exists or create if missing
        dataset_ref = client.dataset(self.dataset_id)
        try:
            client.get_dataset(dataset_ref)
        except google_exceptions.NotFound:
            logger.info("Dataset %s not found. Creating...", self.dataset_id)
            dataset = bigquery.Dataset(dataset_ref)
            dataset.location = "us-central1"
            client.create_dataset(dataset, exists_ok=True)

        job_config = bigquery.LoadJobConfig(
            write_disposition=(
                bigquery.WriteDisposition.WRITE_APPEND
                if write_mode == "append"
                else bigquery.WriteDisposition.WRITE_TRUNCATE
            )
        )

        schema_path = None
        for cand in [
            os.path.join("schemas", f"{self.table_id}_schema.json"),
            os.path.join("schemas", f"{self.table_id}s_schema.json"),
            os.path.join("schemas", "sales_schema.json"),
        ]:
            if os.path.exists(cand):
                schema_path = cand
                break

        if schema_path:
            try:
                job_config.schema = client.schema_from_json(schema_path)
                logger.info("Attached BigQuery schema from %s", schema_path)
            except (json.JSONDecodeError, ValueError, OSError) as exc:
                logger.error("Failed to parse schema from %s: %s", schema_path, exc)
                raise

        if write_mode == "append":
            job_config.schema_update_options = [
                bigquery.SchemaUpdateOption.ALLOW_FIELD_ADDITION,
                bigquery.SchemaUpdateOption.ALLOW_FIELD_RELAXATION,
            ]

        job_config.time_partitioning = bigquery.TimePartitioning(
            type_=bigquery.TimePartitionType.DAY,
            field="order_date",
        )
        job_config.clustering_fields = ["customer_id", "product_category"]

        if hasattr(data, "to_parquet"):
            job = client.load_table_from_dataframe(data, table_ref, job_config=job_config)
        else:
            job = client.load_table_from_json(data, table_ref, job_config=job_config)

        job.result()  # Blocks until job completes

        if job.errors:
            raise RuntimeError(f"FATAL: BigQuery load job failed: {job.errors}")

        logger.info("BigQuery load job finished successfully for table: %s", table_ref)
        return record_count
