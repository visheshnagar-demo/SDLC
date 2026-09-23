"""BigQuery Data Loader module with native partitioning and clustering."""
import os
import pandas as pd
from google.cloud import bigquery
from server.config import config
from server.logger import logger


class BigQueryLoader:
    """Loads transformed DataFrames into partitioned and clustered BigQuery destination tables."""

    def __init__(
        self,
        project_id: str = None,
        dataset_id: str = None,
        table_name: str = None,
        write_disposition: str = None,
    ):
        self.project_id = project_id or config.gcp_project_id
        self.dataset_id = dataset_id or config.bigquery_dataset
        self.table_name = table_name or config.bigquery_table
        self.write_disposition = write_disposition or config.write_disposition

    def load(self, df: pd.DataFrame) -> int:
        """Executes BigQuery batch load job from pandas DataFrame.

        Zero-mock: Raises explicit RuntimeError on failure.
        """
        if df.empty:
            logger.warning("Empty DataFrame provided. Skipping BigQuery load.")
            return 0

        if not self.project_id:
            raise EnvironmentError("GCP Project ID is required for BigQuery loading.")

        client = bigquery.Client(project=self.project_id)
        table_id = f"{self.project_id}.{self.dataset_id}.{self.table_name}"
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

        schema_file = os.path.join("schemas", "vishesh-test1_schema.json")
        if os.path.isfile(schema_file):
            job_config.schema = client.schema_from_json(schema_file)
            logger.info("Loaded BigQuery table schema from %s", schema_file)

        if job_config.write_disposition == bigquery.WriteDisposition.WRITE_APPEND:
            job_config.schema_update_options = [
                bigquery.SchemaUpdateOption.ALLOW_FIELD_ADDITION,
                bigquery.SchemaUpdateOption.ALLOW_FIELD_RELAXATION,
            ]

        load_job = client.load_table_from_dataframe(df, table_id, job_config=job_config)
        load_job.result()  # Blocks until completion

        if load_job.errors:
            error_msg = f"BigQuery load job failed: {load_job.errors}"
            logger.error(error_msg)
            raise RuntimeError(error_msg)

        loaded_count = len(df)
        logger.info("BigQuery load succeeded. %d rows written to %s", loaded_count, table_id)
        return loaded_count
