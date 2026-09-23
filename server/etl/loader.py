"""BigQuery Loader module for atomic and idempotent loading."""
import os
from typing import Optional, Any

try:
    import pandas as pd
except ImportError:
    pd = None

try:
    from google.cloud import bigquery
    from google.api_core.exceptions import NotFound
except ImportError:
    bigquery = None
    NotFound = Exception

from server.etl.observability import logger
from server.etl.schemas import TARGET_SCHEMA


class BigQueryLoader:
    """Loads transformed DataFrames into Google BigQuery."""

    def __init__(
        self,
        project_id: Optional[str] = None,
        dataset_id: Optional[str] = None,
        table_name: Optional[str] = None,
        write_disposition: Optional[str] = None,
    ):
        self.project_id = (
            project_id
            if project_id is not None
            else os.getenv("GCP_PROJECT")
        )
        self.dataset_id = (
            dataset_id
            if dataset_id is not None
            else os.getenv("BIGQUERY_DATASET", "analytics")
        )
        self.table_name = (
            table_name
            if table_name is not None
            else os.getenv("BIGQUERY_TABLE", "postgres_test2")
        )
        self.write_disposition = (
            (write_disposition if write_disposition is not None else os.getenv("WRITE_DISPOSITION", "WRITE_TRUNCATE"))
            or "WRITE_TRUNCATE"
        ).upper()

        if not self.project_id:
            raise EnvironmentError("GCP_PROJECT environment variable is required for BigQuery loading.")
        if not self.dataset_id:
            raise EnvironmentError("BIGQUERY_DATASET environment variable is required.")
        if not self.table_name:
            raise EnvironmentError("BIGQUERY_TABLE environment variable is required.")

    def get_client(self) -> Any:
        if bigquery is None:
            raise RuntimeError("google-cloud-bigquery package is required for BigQuery loading.")
        return bigquery.Client(project=self.project_id)

    def ensure_dataset(self, client: Any) -> Any:
        if bigquery is None:
            raise RuntimeError("google-cloud-bigquery package is required for BigQuery loading.")
        dataset_ref = bigquery.DatasetReference(self.project_id, self.dataset_id)
        try:
            return client.get_dataset(dataset_ref)
        except NotFound:
            logger.info("Creating BigQuery dataset", dataset=self.dataset_id)
            dataset = bigquery.Dataset(dataset_ref)
            dataset.location = os.getenv("GCP_REGION", "us-central1")
            return client.create_dataset(dataset, exists_ok=True)

    def load_dataframe(
        self,
        df: Any,
        client: Optional[Any] = None,
    ) -> int:
        """
        Loads DataFrame into BigQuery table.
        Returns the number of rows loaded.
        """
        if df is None:
            raise ValueError("DataFrame cannot be None.")

        close_client_on_exit = False
        if client is None:
            client = self.get_client()
            close_client_on_exit = True

        try:
            self.ensure_dataset(client)
            table_ref = f"{self.project_id}.{self.dataset_id}.{self.table_name}"

            job_config = None
            if bigquery is not None:
                job_config = bigquery.LoadJobConfig(
                    schema=TARGET_SCHEMA,
                    write_disposition=getattr(
                        bigquery.WriteDisposition,
                        self.write_disposition,
                        bigquery.WriteDisposition.WRITE_TRUNCATE,
                    ),
                    time_partitioning=bigquery.TimePartitioning(
                        type_=bigquery.TimePartitioningType.DAY,
                        field="ingested_at",
                    ),
                    clustering_fields=["id"],
                )

            logger.info(
                "Submitting BigQuery load job",
                target_table=table_ref,
                rows_to_load=len(df),
                write_disposition=self.write_disposition,
            )

            job = client.load_table_from_dataframe(
                df, table_ref, job_config=job_config
            )
            job.result()

            destination_table = client.get_table(table_ref)
            logger.info(
                "BigQuery load job finished successfully",
                table=table_ref,
                output_rows=destination_table.num_rows,
                job_id=job.job_id,
            )

            return len(df)
        except Exception as e:
            logger.error("BigQuery load job failed", error=str(e), table=f"{self.dataset_id}.{self.table_name}")
            raise RuntimeError(f"Failed to load data into BigQuery table '{self.table_name}': {e}") from e
        finally:
            if close_client_on_exit and client is not None:
                client.close()
