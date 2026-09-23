"""BigQuery destination loader for partitioned tables."""
import os
import pandas as pd
from google.cloud import bigquery
from google.cloud.exceptions import NotFound
from pipeline.config import PipelineConfig
from pipeline.logger import get_logger

logger = get_logger("loader")


class BigQueryLoader:
    """Loads transformed records into a partitioned and clustered BigQuery table."""

    def __init__(self, config: PipelineConfig):
        self.config = config
        self.client = bigquery.Client(project=self.config.gcp_project_id)
        self.table_ref = f"{self.config.gcp_project_id}.{self.config.bigquery_dataset}.{self.config.bigquery_table}"

    def ensure_table_exists(self, partition_field: str = "created_at") -> None:
        """Ensures the dataset and partitioned table exist in BigQuery."""
        dataset_ref = f"{self.config.gcp_project_id}.{self.config.bigquery_dataset}"
        try:
            self.client.get_dataset(dataset_ref)
        except NotFound:
            logger.info(f"Dataset {dataset_ref} not found, creating...")
            dataset = bigquery.Dataset(dataset_ref)
            dataset.location = "us-central1"
            self.client.create_dataset(dataset, exists_ok=True)

        try:
            self.client.get_table(self.table_ref)
            logger.info(f"Target table {self.table_ref} already exists.")
        except NotFound:
            logger.info(f"Target table {self.table_ref} not found, initializing with partitioning...")
            table = bigquery.Table(self.table_ref)
            
            # Setup time partitioning
            table.time_partitioning = bigquery.TimePartitioning(
                type_=bigquery.TimePartitioningType.DAY,
                field=partition_field,
            )
            # Setup clustering
            table.clustering_fields = ["order_status", "product_category"]
            
            # Load schema from JSON if available
            schema_paths = [
                os.path.join("schemas", "sales_order_schema.json"),
                os.path.join("schemas", "vishesh-test1_schema.json"),
            ]
            for path in schema_paths:
                if os.path.exists(path):
                    table.schema = self.client.schema_from_json(path)
                    break

            self.client.create_table(table, exists_ok=True)
            logger.info(f"Created partitioned table {self.table_ref}.")

    def load(self, df: pd.DataFrame) -> int:
        """Loads the DataFrame into the destination BigQuery table.

        Zero-mock policy: executes real load and raises RuntimeError if it fails.
        """
        if df.empty:
            logger.warning("Empty DataFrame provided for loading. Skipping BigQuery job.")
            return 0

        logger.info(f"Loading {len(df)} records into BigQuery table: {self.table_ref}")
        self.ensure_table_exists()

        write_disp = (
            bigquery.WriteDisposition.WRITE_APPEND
            if self.config.write_disposition == "WRITE_APPEND"
            else bigquery.WriteDisposition.WRITE_TRUNCATE
        )

        job_config = bigquery.LoadJobConfig(
            write_disposition=write_disp,
        )

        # Attach schema if found
        schema_paths = [
            os.path.join("schemas", "sales_order_schema.json"),
            os.path.join("schemas", "vishesh-test1_schema.json"),
        ]
        for path in schema_paths:
            if os.path.exists(path):
                job_config.schema = self.client.schema_from_json(path)
                break

        if write_disp == bigquery.WriteDisposition.WRITE_APPEND:
            job_config.schema_update_options = [
                bigquery.SchemaUpdateOption.ALLOW_FIELD_ADDITION,
                bigquery.SchemaUpdateOption.ALLOW_FIELD_RELAXATION,
            ]

        # Use load_table_from_dataframe with pyarrow backend
        job = self.client.load_table_from_dataframe(df, self.table_ref, job_config=job_config)
        job.result()  # Wait for completion

        if job.errors:
            error_details = f"BigQuery load failed with errors: {job.errors}"
            logger.error(error_details)
            raise RuntimeError(error_details)

        loaded_rows = len(df)
        logger.info(f"Successfully loaded {loaded_rows} records into {self.table_ref}.")
        return loaded_rows
