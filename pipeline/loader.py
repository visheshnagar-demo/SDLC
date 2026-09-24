"""Loader module for ingesting cleaned records into Google BigQuery."""

import json
import logging
import os
from typing import Optional, Union

try:
    import pandas as pd
except ImportError:
    pd = None

try:
    from google.cloud import bigquery
    from google.cloud.exceptions import NotFound
except ImportError:
    bigquery = None
    NotFound = Exception

from pipeline.config import PipelineConfig

logger = logging.getLogger(__name__)


class BigQueryLoader:
    """Handles BigQuery dataset/table management and data ingestion."""

    def __init__(
        self,
        project_id: Optional[str] = None,
        dataset_id: Optional[str] = None,
        table_id: Optional[str] = None,
        config: Optional[PipelineConfig] = None,
        client: Optional[object] = None,
    ):
        if config is not None:
            self.project_id = config.gcp_project
            self.dataset_name = config.bigquery_dataset
            self.table_name = config.bigquery_table
        else:
            self.project_id = project_id or os.getenv("GCP_PROJECT", "upbeat-repeater-477110-q6")
            self.dataset_name = dataset_id or os.getenv("BIGQUERY_DATASET", "analytics")
            self.table_name = table_id or os.getenv("BIGQUERY_TABLE", "test01")

        self.dataset_id = f"{self.project_id}.{self.dataset_name}"
        self.table_id = f"{self.project_id}.{self.dataset_name}.{self.table_name}"

        if client is not None:
            self.client = client
        else:
            if bigquery is None:
                raise ImportError("google.cloud.bigquery is required for BigQueryLoader")
            self.client = bigquery.Client(project=self.project_id)

    def get_schema(self, schema_file_path: Optional[str] = None) -> list:
        """Returns BigQuery SchemaField list from JSON schema file or default structure."""
        if schema_file_path and os.path.isfile(schema_file_path):
            with open(schema_file_path, "r", encoding="utf-8") as f:
                fields_data = json.load(f)
            if bigquery and hasattr(bigquery, "SchemaField"):
                return [
                    bigquery.SchemaField(
                        name=f["name"],
                        field_type=f["type"],
                        mode=f.get("mode", "NULLABLE"),
                        description=f.get("description", ""),
                    )
                    for f in fields_data
                ]
            return fields_data

        default_schema_file = os.path.join(
            os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
            "schemas",
            f"{self.table_name}_schema.json",
        )
        if os.path.isfile(default_schema_file):
            return self.get_schema(default_schema_file)

        if bigquery and hasattr(bigquery, "SchemaField"):
            return [
                bigquery.SchemaField("rank", "INTEGER", mode="NULLABLE", description="Ranking of the tour"),
                bigquery.SchemaField("peak", "INTEGER", mode="NULLABLE", description="Peak position achieved"),
                bigquery.SchemaField("all_time_peak", "INTEGER", mode="NULLABLE", description="All time peak position"),
                bigquery.SchemaField("actual_gross", "INTEGER", mode="NULLABLE", description="Actual gross earnings"),
                bigquery.SchemaField("adjusted_gross_in_2022_dollars", "INTEGER", mode="NULLABLE", description="Adjusted gross in 2022 dollars"),
                bigquery.SchemaField("artist", "STRING", mode="NULLABLE", description="Artist name"),
                bigquery.SchemaField("tour_title", "STRING", mode="NULLABLE", description="Tour title"),
                bigquery.SchemaField("years", "STRING", mode="NULLABLE", description="Years active/performed"),
                bigquery.SchemaField("shows", "INTEGER", mode="NULLABLE", description="Number of shows"),
                bigquery.SchemaField("average_gross", "INTEGER", mode="NULLABLE", description="Average gross per show"),
                bigquery.SchemaField("ref", "STRING", mode="NULLABLE", description="Reference citations"),
                bigquery.SchemaField("_etl_loaded_at", "TIMESTAMP", mode="REQUIRED", description="Load timestamp"),
                bigquery.SchemaField("_source_file", "STRING", mode="REQUIRED", description="Source GCS file URI"),
            ]
        return []

    def ensure_dataset_exists(self) -> None:
        """Create BigQuery dataset if it does not already exist."""
        try:
            self.client.get_dataset(self.dataset_id)
            logger.info("Dataset '%s' exists.", self.dataset_id)
        except Exception as e:
            if "NotFound" in type(e).__name__ or (NotFound and isinstance(e, NotFound)):
                logger.info("Dataset '%s' not found. Creating dataset...", self.dataset_id)
                if bigquery and hasattr(bigquery, "Dataset"):
                    dataset = bigquery.Dataset(self.dataset_id)
                    dataset.location = "US"
                    self.client.create_dataset(dataset, exists_ok=True)
                else:
                    self.client.create_dataset(self.dataset_id, exists_ok=True)
                logger.info("Dataset '%s' created successfully.", self.dataset_id)
            else:
                raise

    def ensure_table_exists(self, schema_file_path: Optional[str] = None) -> None:
        """Create BigQuery table with partitioning and clustering if it does not exist."""
        self.ensure_dataset_exists()
        try:
            self.client.get_table(self.table_id)
            logger.info("Table '%s' exists.", self.table_id)
        except Exception as e:
            if "NotFound" in type(e).__name__ or (NotFound and isinstance(e, NotFound)):
                logger.info("Table '%s' not found. Creating table...", self.table_id)
                schema = self.get_schema(schema_file_path)
                if bigquery and hasattr(bigquery, "Table"):
                    table = bigquery.Table(self.table_id, schema=schema)
                    if hasattr(bigquery, "TimePartitioning"):
                        table.time_partitioning = bigquery.TimePartitioning(
                            type_=bigquery.TimePartitioningType.DAY,
                            field="_etl_loaded_at",
                        )
                    table.clustering_fields = ["artist"]
                    self.client.create_table(table, exists_ok=True)
                else:
                    self.client.create_table(self.table_id, exists_ok=True)
                logger.info("Table '%s' created successfully.", self.table_id)
            else:
                raise

    def load(
        self,
        df: object,
        write_disposition: str = "WRITE_TRUNCATE",
        schema_file_path: Optional[str] = None,
    ) -> int:
        """Load DataFrame into BigQuery table idempotently."""
        self.ensure_table_exists(schema_file_path)

        if hasattr(df, "empty") and df.empty:
            logger.info("DataFrame is empty. Skipping table write.")
            return 0

        row_count = len(df) if hasattr(df, "__len__") else 0
        logger.info("Loading %d rows into '%s' with write disposition '%s'...", row_count, self.table_id, write_disposition)
        schema = self.get_schema(schema_file_path)

        if bigquery and hasattr(bigquery, "LoadJobConfig"):
            job_config = bigquery.LoadJobConfig(
                schema=schema,
                write_disposition=write_disposition,
            )
        else:
            job_config = {"write_disposition": write_disposition}

        job = self.client.load_table_from_dataframe(
            df,
            self.table_id,
            job_config=job_config,
        )
        job.result()  # Wait for the load job to complete

        table = self.client.get_table(self.table_id)
        num_rows = getattr(table, "num_rows", row_count)
        logger.info("Load job complete. Table '%s' now has %d total rows.", self.table_id, num_rows)
        return row_count
