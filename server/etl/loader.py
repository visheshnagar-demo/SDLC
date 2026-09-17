"""BigQuery Loader module for inserting transformed records and errors."""
import os
import json
import logging
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional

logger = logging.getLogger(__name__)


class BigQueryLoader:
    """Loads transformed records and error records into BigQuery tables."""

    def __init__(
        self,
        project_id: Optional[str] = None,
        dataset_id: Optional[str] = None,
        table_id: Optional[str] = None,
        error_table_id: Optional[str] = None,
        client=None,
        dry_run: bool = False,
    ):
        self.project_id = (
            project_id
            or os.getenv("GCP_PROJECT_ID")
            or "upbeat-repeater-477110-q6"
        )
        self.dataset_id = (
            dataset_id
            or os.getenv("BQ_DATASET_ID")
            or "analytics"
        )
        self.table_id = (
            table_id
            or os.getenv("BQ_TABLE_ID")
            or "transformed_data"
        )
        self.error_table_id = (
            error_table_id
            or os.getenv("BQ_ERROR_TABLE_ID")
            or "analytics_errors"
        )
        self._client = client
        self.dry_run = dry_run or os.getenv("DRY_RUN", "").lower() in ("true", "1")

    def _get_client(self):
        if self.dry_run:
            return None
        if self._client is not None:
            return self._client
        try:
            from google.cloud import bigquery

            self._client = bigquery.Client(project=self.project_id)
            return self._client
        except Exception as exc:
            logger.warning("Could not initialize BigQuery client: %s", exc)
            return None

    @property
    def target_table_ref(self) -> str:
        return f"{self.project_id}.{self.dataset_id}.{self.table_id}"

    @property
    def error_table_ref(self) -> str:
        return f"{self.project_id}.{self.dataset_id}.{self.error_table_id}"

    def ensure_dataset_and_tables(self) -> bool:
        """Ensures that the dataset and required tables exist in BigQuery."""
        client = self._get_client()
        if client is None:
            logger.info("Local / Mock execution: Skipping dataset/table creation.")
            return True

        from google.cloud import bigquery

        # Ensure dataset
        dataset_ref = f"{self.project_id}.{self.dataset_id}"
        dataset = bigquery.Dataset(dataset_ref)
        dataset.location = "US"
        try:
            client.create_dataset(dataset, exists_ok=True)
            logger.info("Ensured BigQuery dataset exists: %s", dataset_ref)
        except Exception as e:
            logger.warning("Dataset verification notice: %s", e)

        # Transformed data table schema
        transformed_schema = [
            bigquery.SchemaField("record_id", "STRING", mode="REQUIRED", description="Unique record identifier"),
            bigquery.SchemaField("data_payload", "STRING", mode="NULLABLE", description="JSON string payload of attributes"),
            bigquery.SchemaField("created_at", "TIMESTAMP", mode="NULLABLE", description="Record creation timestamp"),
            bigquery.SchemaField("_ingestion_timestamp", "TIMESTAMP", mode="REQUIRED", description="ETL processing timestamp"),
            bigquery.SchemaField("_source_file", "STRING", mode="REQUIRED", description="Source GCS file URI"),
        ]
        table = bigquery.Table(self.target_table_ref, schema=transformed_schema)
        try:
            client.create_table(table, exists_ok=True)
            logger.info("Ensured BigQuery table exists: %s", self.target_table_ref)
        except Exception as e:
            logger.warning("Table verification notice: %s", e)

        # Errors table schema
        error_schema = [
            bigquery.SchemaField("error_id", "STRING", mode="REQUIRED", description="Unique error identifier"),
            bigquery.SchemaField("raw_record", "STRING", mode="NULLABLE", description="Raw serialized record string"),
            bigquery.SchemaField("error_message", "STRING", mode="REQUIRED", description="Error details"),
            bigquery.SchemaField("_ingestion_timestamp", "TIMESTAMP", mode="REQUIRED", description="ETL processing timestamp"),
            bigquery.SchemaField("_source_file", "STRING", mode="REQUIRED", description="Source GCS file URI"),
        ]
        err_table = bigquery.Table(self.error_table_ref, schema=error_schema)
        try:
            client.create_table(err_table, exists_ok=True)
            logger.info("Ensured BigQuery error table exists: %s", self.error_table_ref)
        except Exception as e:
            logger.warning("Error table verification notice: %s", e)

        return True

    def load_transformed_records(
        self, records: List[Dict[str, Any]], write_disposition: str = "WRITE_APPEND"
    ) -> int:
        """Loads valid transformed records into BigQuery target table."""
        if not records:
            logger.info("No transformed records to load.")
            return 0

        now_utc = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
        sanitized_records = []
        for r in records:
            item = dict(r)
            if "_ingestion_timestamp" not in item:
                item["_ingestion_timestamp"] = now_utc
            if "_source_file" not in item:
                item["_source_file"] = "gs://sdlc-workspec-store/etl/data/my_file (1).csv"
            sanitized_records.append(item)

        client = self._get_client()
        if client is None:
            logger.info("Client unavailable; mock loaded %d records into %s", len(sanitized_records), self.target_table_ref)
            return len(sanitized_records)

        from google.cloud import bigquery

        job_config = bigquery.LoadJobConfig(
            write_disposition=getattr(bigquery.WriteDisposition, write_disposition, bigquery.WriteDisposition.WRITE_APPEND),
            schema=[
                bigquery.SchemaField("record_id", "STRING", mode="REQUIRED"),
                bigquery.SchemaField("data_payload", "STRING", mode="NULLABLE"),
                bigquery.SchemaField("created_at", "TIMESTAMP", mode="NULLABLE"),
                bigquery.SchemaField("_ingestion_timestamp", "TIMESTAMP", mode="REQUIRED"),
                bigquery.SchemaField("_source_file", "STRING", mode="REQUIRED"),
            ],
        )

        job = client.load_table_from_json(sanitized_records, self.target_table_ref, job_config=job_config)
        job.result()  # Wait for job to complete
        logger.info("Loaded %d records into %s", len(sanitized_records), self.target_table_ref)
        return len(sanitized_records)

    def load_error_records(self, error_records: List[Dict[str, Any]]) -> int:
        """Loads rejected error records into BigQuery error table."""
        if not error_records:
            return 0

        now_utc = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
        sanitized_errors = []
        for r in error_records:
            item = dict(r)
            if "_ingestion_timestamp" not in item:
                item["_ingestion_timestamp"] = now_utc
            if "_source_file" not in item:
                item["_source_file"] = "gs://sdlc-workspec-store/etl/data/my_file (1).csv"
            sanitized_errors.append(item)

        client = self._get_client()
        if client is None:
            logger.info("Client unavailable; mock loaded %d error records into %s", len(sanitized_errors), self.error_table_ref)
            return len(sanitized_errors)

        from google.cloud import bigquery

        job_config = bigquery.LoadJobConfig(
            write_disposition=bigquery.WriteDisposition.WRITE_APPEND,
            schema=[
                bigquery.SchemaField("error_id", "STRING", mode="REQUIRED"),
                bigquery.SchemaField("raw_record", "STRING", mode="NULLABLE"),
                bigquery.SchemaField("error_message", "STRING", mode="REQUIRED"),
                bigquery.SchemaField("_ingestion_timestamp", "TIMESTAMP", mode="REQUIRED"),
                bigquery.SchemaField("_source_file", "STRING", mode="REQUIRED"),
            ],
        )

        job = client.load_table_from_json(sanitized_errors, self.error_table_ref, job_config=job_config)
        job.result()
        logger.info("Loaded %d error records into %s", len(sanitized_errors), self.error_table_ref)
        return len(sanitized_errors)
