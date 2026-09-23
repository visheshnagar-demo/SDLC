"""BigQuery loader module."""
import os
import logging

try:
    import pandas as pd
except ImportError:
    pd = None

try:
    from google.cloud import bigquery
except ImportError:
    bigquery = None

logger = logging.getLogger(__name__)


class BigQueryLoader:
    """Loads transformed DataFrames into BigQuery using Load Jobs."""

    def __init__(self, project_id: str = None, dataset_id: str = "analytics", table_id: str = "postgres_test2"):
        self.project_id = project_id or os.getenv("GCP_PROJECT_ID") or os.getenv("PROJECT_ID") or "upbeat-repeater-477110-q6"
        self.dataset_id = dataset_id or os.getenv("BIGQUERY_DATASET", "analytics")
        self.table_id = table_id or os.getenv("BIGQUERY_TABLE", "postgres_test2")
        self._client = None

    @property
    def client(self):
        if self._client is None:
            if bigquery is None:
                raise RuntimeError("google-cloud-bigquery is required for BigQueryLoader.")
            self._client = bigquery.Client(project=self.project_id)
        return self._client

    def load_dataframe(self, df, write_mode: str = "overwrite") -> bool:
        """Loads a pandas DataFrame into the destination BigQuery table."""
        if pd is None or bigquery is None:
            raise RuntimeError("pandas and google-cloud-bigquery are required.")
        if df.empty:
            logger.warning("Empty DataFrame provided. Skipping BigQuery load.")
            return True

        table_ref = f"{self.project_id}.{self.dataset_id}.{self.table_id}"
        logger.info("Loading %d records into BigQuery table %s (mode=%s)...", len(df), table_ref, write_mode)

        write_disp = (
            bigquery.WriteDisposition.WRITE_APPEND
            if write_mode == "append"
            else bigquery.WriteDisposition.WRITE_TRUNCATE
        )

        job_config = bigquery.LoadJobConfig(
            write_disposition=write_disp,
        )

        schema_path = os.path.join("schemas", f"{self.table_id}_schema.json")
        if os.path.isfile(schema_path):
            try:
                job_config.schema = self.client.schema_from_json(schema_path)
                logger.info("Loaded schema definition from %s", schema_path)
            except Exception as err:
                raise RuntimeError(f"Failed loading BigQuery schema from {schema_path}: {err}") from err

        try:
            job = self.client.load_table_from_dataframe(df, table_ref, job_config=job_config)
            job.result()
        except Exception as load_err:
            logger.error("BigQuery load execution failed: %s", load_err)
            raise RuntimeError(f"BigQuery load failed: {load_err}") from load_err

        if job.errors:
            raise RuntimeError(f"BigQuery load job errors: {job.errors}")

        logger.info("Successfully loaded %d records into %s", len(df), table_ref)
        return True
