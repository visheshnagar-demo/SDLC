"""BigQuery Loader Module for Sales ETL Pipeline.

Loads cleaned and deduplicated sales records into partitioned BigQuery table.
Includes schema reconciliation, dataset creation, and time-partitioning configuration.
"""
import os
import json
import logging
from typing import Optional, List
import pandas as pd
from google.cloud import bigquery

logger = logging.getLogger("sales_etl.loader")


class BigQueryLoader:
    """Loads DataFrame into Google Cloud BigQuery with partition and cluster configs."""

    def __init__(
        self,
        project_id: Optional[str] = None,
        dataset_id: Optional[str] = None,
        table_id: Optional[str] = None,
        location: Optional[str] = "us-central1",
    ):
        self.project_id = (
            project_id
            or os.getenv("GCP_PROJECT_ID")
            or os.getenv("GOOGLE_CLOUD_PROJECT")
            or "upbeat-repeater-477110-q6"
        )
        self.dataset_id = dataset_id or os.getenv("BIGQUERY_DATASET") or "analytics"
        self.table_id = table_id or os.getenv("BIGQUERY_TABLE") or "aarchi_gcs_test1"
        self.location = location or os.getenv("BQ_LOCATION") or "us-central1"
        self.client = bigquery.Client(project=self.project_id)

    @property
    def table_reference(self) -> str:
        return f"{self.project_id}.{self.dataset_id}.{self.table_id}"

    def ensure_dataset(self) -> None:
        """Ensures target BigQuery dataset exists in the specified location."""
        dataset_ref = self.client.dataset(self.dataset_id, project=self.project_id)
        ds = bigquery.Dataset(dataset_ref)
        ds.location = self.location
        try:
            self.client.create_dataset(ds, exists_ok=True)
            logger.info("Ensured BigQuery dataset '%s' exists in location '%s'.", self.dataset_id, self.location)
        except Exception as ds_err:
            logger.critical("FATAL: Failed to ensure dataset '%s' exists: %s", self.dataset_id, ds_err)
            raise RuntimeError(f"Failed to create or verify dataset: {ds_err}") from ds_err

    def load_schema(self) -> List[bigquery.SchemaField]:
        """Loads BigQuery schema from JSON definition."""
        candidate_paths = [
            os.path.join("schemas", f"{self.table_id}_schema.json"),
            os.path.join("schemas", "sales_schema.json"),
            os.path.join("schemas", "aarchi_gcs_test1_schema.json"),
        ]
        for path in candidate_paths:
            if os.path.isfile(path):
                logger.info("Found schema definition file: %s", path)
                with open(path, "r", encoding="utf-8") as f:
                    schema_data = json.load(f)
                return [bigquery.SchemaField.from_api_repr(field) for field in schema_data]

        logger.warning("No schema file found. Falling back to default schema fields.")
        return [
            bigquery.SchemaField("order_id", "INTEGER", mode="REQUIRED"),
            bigquery.SchemaField("customer_id", "STRING", mode="NULLABLE"),
            bigquery.SchemaField("customer_name", "STRING", mode="NULLABLE"),
            bigquery.SchemaField("customer_email", "STRING", mode="NULLABLE"),
            bigquery.SchemaField("product_category", "STRING", mode="NULLABLE"),
            bigquery.SchemaField("amount", "FLOAT", mode="NULLABLE"),
            bigquery.SchemaField("currency", "STRING", mode="NULLABLE"),
            bigquery.SchemaField("order_status", "STRING", mode="NULLABLE"),
            bigquery.SchemaField("created_at", "TIMESTAMP", mode="NULLABLE"),
            bigquery.SchemaField("order_date", "DATE", mode="REQUIRED"),
            bigquery.SchemaField("ingestion_timestamp", "TIMESTAMP", mode="REQUIRED"),
            bigquery.SchemaField("etl_batch_id", "STRING", mode="REQUIRED"),
        ]

    def load(
        self,
        df: pd.DataFrame,
        write_mode: str = "append",
    ) -> int:
        """Loads DataFrame to BigQuery target table.

        Args:
            df: Cleaned and deduplicated DataFrame.
            write_mode: 'append' or 'overwrite'.

        Returns:
            int: Number of rows successfully loaded.

        Raises:
            RuntimeError: If load job fails.
        """
        if df is None or df.empty:
            logger.warning("No records to load. Skipping BigQuery load phase.")
            return 0

        self.ensure_dataset()
        schema_fields = self.load_schema()

        df_to_load = df.copy()

        # Reconcile schema and apply type coercion to avoid pyarrow issues
        for field in schema_fields:
            col = field.name
            f_type = field.field_type.upper()
            if col not in df_to_load.columns:
                df_to_load[col] = None
            else:
                if f_type in ("INTEGER", "INT64"):
                    df_to_load[col] = pd.to_numeric(df_to_load[col], errors="coerce").astype("Int64")
                elif f_type in ("FLOAT", "FLOAT64", "NUMERIC"):
                    df_to_load[col] = pd.to_numeric(df_to_load[col], errors="coerce")
                elif f_type in ("TIMESTAMP", "DATETIME"):
                    df_to_load[col] = pd.to_datetime(df_to_load[col], errors="coerce", utc=True)
                elif f_type == "DATE":
                    df_to_load[col] = pd.to_datetime(df_to_load[col]).dt.date
                elif f_type == "STRING":
                    df_to_load[col] = df_to_load[col].apply(lambda v: str(v) if pd.notna(v) else None)

        job_config = bigquery.LoadJobConfig(
            schema=schema_fields,
            write_disposition=(
                bigquery.WriteDisposition.WRITE_APPEND
                if write_mode == "append"
                else bigquery.WriteDisposition.WRITE_TRUNCATE
            ),
            create_disposition=bigquery.CreateDisposition.CREATE_IF_NEEDED,
            time_partitioning=bigquery.TimePartitioning(
                type_=bigquery.TimePartitioningType.DAY,
                field="order_date",
            ),
            clustering_fields=["order_id", "customer_id", "order_status"],
        )

        if write_mode == "append":
            job_config.schema_update_options = [
                bigquery.SchemaUpdateOption.ALLOW_FIELD_ADDITION,
                bigquery.SchemaUpdateOption.ALLOW_FIELD_RELAXATION,
            ]

        logger.info(
            "Loading %d records into BigQuery table %s (Write disposition: %s)",
            len(df_to_load),
            self.table_reference,
            job_config.write_disposition,
        )

        try:
            job = self.client.load_table_from_dataframe(
                df_to_load,
                self.table_reference,
                job_config=job_config,
            )
            job.result()  # Wait for job completion
            logger.info("BigQuery load job %s completed successfully.", job.job_id)
        except Exception as load_err:
            logger.critical("FATAL: BigQuery load job failed: %s", load_err)
            raise RuntimeError(f"BigQuery load failed: {load_err}") from load_err

        return len(df_to_load)
