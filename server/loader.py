"""Google BigQuery Data Warehouse Loader.

Loads cleaned datasets into Google BigQuery with partition/clustering configuration,
explicit schema conformance, and atomic commit semantics.
"""
import logging
from typing import Any, Dict, List, Optional
import pandas as pd
from server.config import Settings

logger = logging.getLogger("server.loader")


class BigQueryLoader:
    """Loads cleaned dataframes into BigQuery."""

    def __init__(self, settings: Settings):
        self.settings = settings
        self._client = None

    def _get_client(self):
        """Initializes and returns BigQuery Client."""
        if self._client is None:
            if not self.settings.gcp_project_id:
                raise EnvironmentError("GCP_PROJECT_ID is required to initialize BigQuery client.")
            from google.cloud import bigquery
            self._client = bigquery.Client(project=self.settings.gcp_project_id)
        return self._client

    def get_bigquery_schema(self) -> list:
        """Constructs BigQuery TableSchema specification."""
        from google.cloud import bigquery
        return [
            bigquery.SchemaField("id", "INT64", mode="NULLABLE", description="Record Identifier"),
            bigquery.SchemaField("data_val", "STRING", mode="NULLABLE", description="Sanitized Data Value"),
            bigquery.SchemaField("created_at", "TIMESTAMP", mode="NULLABLE", description="Record Creation Timestamp"),
            bigquery.SchemaField("_etl_loaded_at", "TIMESTAMP", mode="NULLABLE", description="ETL Ingestion UTC Timestamp"),
            bigquery.SchemaField("_etl_batch_id", "STRING", mode="NULLABLE", description="ETL Batch Execution Identifier"),
        ]

    def ensure_table(self, dataset_id: Optional[str] = None, table_id: Optional[str] = None) -> None:
        """Ensures destination dataset and table exist with partitioning and clustering."""
        from google.cloud import bigquery
        from google.api_core.exceptions import NotFound
        client = self._get_client()
        ds_name = dataset_id or self.settings.bigquery_dataset
        tbl_name = table_id or self.settings.bigquery_table
        table_ref = f"{self.settings.gcp_project_id}.{ds_name}.{tbl_name}"

        # Ensure dataset
        dataset_ref = bigquery.DatasetReference(self.settings.gcp_project_id, ds_name)
        try:
            client.get_dataset(dataset_ref)
        except NotFound:
            dataset = bigquery.Dataset(dataset_ref)
            dataset.location = "US"
            client.create_dataset(dataset, exists_ok=True)
            logger.info("Created BigQuery dataset: %s", ds_name)

        # Ensure table
        try:
            client.get_table(table_ref)
        except NotFound:
            table = bigquery.Table(table_ref, schema=self.get_bigquery_schema())
            table.time_partitioning = bigquery.TimePartitioning(
                type_=bigquery.TimePartitioningType.DAY,
                field="created_at",
            )
            table.clustering_fields = ["id"]
            client.create_table(table, exists_ok=True)
            logger.info("Created partitioned & clustered BigQuery table: %s", table_ref)

    def load_dataframe(
        self,
        df: pd.DataFrame,
        dataset_id: Optional[str] = None,
        table_id: Optional[str] = None,
        write_disposition: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Loads a pandas DataFrame directly into BigQuery target table."""
        if df.empty:
            logger.warning("No records to load into BigQuery. Skipping load step.")
            return {"status": "SKIPPED", "loaded_rows": 0}

        from google.cloud import bigquery
        client = self._get_client()
        ds_name = dataset_id or self.settings.bigquery_dataset
        tbl_name = table_id or self.settings.bigquery_table
        table_ref = f"{self.settings.gcp_project_id}.{ds_name}.{tbl_name}"

        self.ensure_table(ds_name, tbl_name)

        disposition = write_disposition or self.settings.write_disposition
        job_config = bigquery.LoadJobConfig(
            schema=self.get_bigquery_schema(),
            write_disposition=disposition,
        )

        logger.info(
            "Submitting BigQuery Load Job for %d records to %s (write_disposition=%s)",
            len(df),
            table_ref,
            disposition,
        )

        job = client.load_table_from_dataframe(df, table_ref, job_config=job_config)
        job.result()  # Blocks until load completes

        if job.errors:
            logger.error("BigQuery load job encountered errors: %s", job.errors)
            raise RuntimeError(f"FATAL: BigQuery load job failed with errors: {job.errors}")

        logger.info("BigQuery load successful: %d rows loaded to %s", len(df), table_ref)
        return {
            "status": "SUCCESS",
            "table": table_ref,
            "loaded_rows": len(df),
            "job_id": job.job_id,
        }
