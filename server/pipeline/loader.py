"""Loader module: manages BigQuery dataset/table creation and data loading."""
import logging
import os
import pandas as pd
from google.cloud import bigquery
from google.cloud.exceptions import NotFound
from server.pipeline.config import PipelineConfig

logger = logging.getLogger(__name__)


class BigQueryLoader:
    def __init__(self, config: PipelineConfig):
        self.config = config
        self.client = bigquery.Client(project=self.config.gcp_project_id)

    def ensure_dataset_exists(self) -> None:
        """Creates target dataset in BigQuery if it does not already exist."""
        dataset_ref = bigquery.DatasetReference(self.config.gcp_project_id, self.config.bq_dataset)
        try:
            self.client.get_dataset(dataset_ref)
            logger.info("BigQuery dataset %s already exists.", self.config.bq_dataset)
        except NotFound:
            logger.info("Dataset %s not found. Creating dataset...", self.config.bq_dataset)
            dataset = bigquery.Dataset(dataset_ref)
            dataset.location = "US"
            self.client.create_dataset(dataset, exists_ok=True)
            logger.info("Successfully created BigQuery dataset %s", self.config.bq_dataset)

    def load_dataframe(self, df: pd.DataFrame, write_disposition: str = "WRITE_TRUNCATE") -> int:
        """Loads a pandas DataFrame into the target BigQuery table.
        
        Returns the number of rows loaded.
        """
        self.ensure_dataset_exists()
        table_ref = f"{self.config.gcp_project_id}.{self.config.bq_dataset}.{self.config.bq_table}"
        logger.info("Loading %d records into BigQuery table %s", len(df), table_ref)

        disposition = (
            bigquery.WriteDisposition.WRITE_APPEND
            if write_disposition == "WRITE_APPEND"
            else bigquery.WriteDisposition.WRITE_TRUNCATE
        )

        job_config = bigquery.LoadJobConfig(write_disposition=disposition)

        # Attach explicit schema if available
        schema_path = os.path.join("schemas", f"{self.config.bq_table}_schema.json")
        if os.path.isfile(schema_path):
            job_config.schema = self.client.schema_from_json(schema_path)
            logger.info("Using explicit BigQuery schema definition from %s", schema_path)

        job = self.client.load_table_from_dataframe(df, table_ref, job_config=job_config)
        job.result()  # Wait for completion

        if job.errors:
            raise RuntimeError(f"BigQuery load job failed: {job.errors}")

        logger.info("Successfully loaded data into BigQuery table %s", table_ref)
        return len(df)
