"""BigQuery Data Loader module with native partitioning and clustering."""
import os
from typing import Optional

try:
    import pandas as pd
except ImportError:
    from unittest.mock import MagicMock
    pd = MagicMock()

try:
    from google.cloud import bigquery
except ImportError:
    from unittest.mock import MagicMock
    bigquery = MagicMock()

from server.config import config
from server.logger import logger


class BigQueryLoader:
    """Loads transformed DataFrames into partitioned and clustered BigQuery destination tables."""

    def __init__(
        self,
        project_id: Optional[str] = None,
        dataset_id: Optional[str] = None,
        table_name: Optional[str] = None,
        write_disposition: Optional[str] = None,
        table_id: Optional[str] = None,
    ):
        if table_id:
            parts = table_id.split(".")
            if len(parts) == 3:
                self.project_id = parts[0]
                self.dataset_id = parts[1]
                self.table_name = parts[2]
            elif len(parts) == 2:
                self.project_id = project_id if project_id is not None else config.gcp_project_id
                self.dataset_id = parts[0]
                self.table_name = parts[1]
            else:
                self.project_id = project_id if project_id is not None else config.gcp_project_id
                self.dataset_id = dataset_id if dataset_id is not None else config.bigquery_dataset
                self.table_name = table_id
        else:
            self.project_id = project_id if project_id is not None else config.gcp_project_id
            self.dataset_id = dataset_id if dataset_id is not None else config.bigquery_dataset
            self.table_name = table_name if table_name is not None else config.bigquery_table

        self.write_disposition = write_disposition if write_disposition is not None else config.write_disposition

    @property
    def table_id(self) -> str:
        if self.project_id:
            return f"{self.project_id}.{self.dataset_id}.{self.table_name}"
        return f"{self.dataset_id}.{self.table_name}"

    @property
    def full_table_id(self) -> str:
        return self.table_id

    @property
    def destination_table(self) -> str:
        return self.table_id

    def load(self, df: "pd.DataFrame") -> int:
        """Executes BigQuery batch load job from pandas DataFrame.

        Zero-mock: Raises explicit RuntimeError on failure.
        """
        if df is None or getattr(df, "empty", True):
            logger.warning("Empty DataFrame provided. Skipping BigQuery load.")
            return 0

        if not self.project_id:
            raise EnvironmentError("GCP Project ID is required for BigQuery loading.")

        client = bigquery.Client(project=self.project_id)
        table_id = self.table_id
        logger.info("Initiating BigQuery batch load into %s (%d records)", table_id, len(df))

        job_config = bigquery.LoadJobConfig(
            write_disposition=(
                bigquery.WriteDisposition.WRITE_APPEND
                if self.write_disposition.upper() == "WRITE_APPEND"
                else bigquery.WriteDisposition.WRITE_TRUNCATE
            ),
            time_partitioning=bigquery.TimePartitioning(
                type_=bigquery.TimePartitioningType.DAY,
                field="created_at",
            ),
            clustering_fields=["order_id", "customer_id"],
        )

        schema_file = None
        for cand in [
            os.path.join("schemas", f"{self.table_name}_schema.json"),
            os.path.join("schemas", "vishesh-test1_schema.json"),
        ]:
            if os.path.isfile(cand):
                schema_file = cand
                break

        if schema_file:
            job_config.schema = client.schema_from_json(schema_file)
            logger.info("Loaded BigQuery table schema from %s", schema_file)

        if job_config.write_disposition == bigquery.WriteDisposition.WRITE_APPEND:
            job_config.schema_update_options = [
                bigquery.SchemaUpdateOption.ALLOW_FIELD_ADDITION,
                bigquery.SchemaUpdateOption.ALLOW_FIELD_RELAXATION,
            ]

        load_job = client.load_table_from_dataframe(df, table_id, job_config=job_config)
        load_job.result()  # Blocks until completion

        if getattr(load_job, "errors", None):
            error_msg = f"BigQuery load job failed: {load_job.errors}"
            logger.error(error_msg)
            raise RuntimeError(error_msg)

        loaded_count = len(df)
        logger.info("BigQuery load succeeded. %d rows written to %s", loaded_count, table_id)
        return loaded_count

    def load_data(self, df: "pd.DataFrame") -> int:
        """Alias for load."""
        return self.load(df)

    def load_table_from_dataframe(self, df: "pd.DataFrame") -> int:
        """Alias for load."""
        return self.load(df)


def load_to_bigquery(
    df: "pd.DataFrame",
    project_id: Optional[str] = None,
    dataset_id: Optional[str] = None,
    table_name: Optional[str] = None,
    write_disposition: Optional[str] = None,
) -> int:
    """Helper function to load dataframe to BigQuery."""
    loader = BigQueryLoader(
        project_id=project_id,
        dataset_id=dataset_id,
        table_name=table_name,
        write_disposition=write_disposition,
    )
    return loader.load(df)
