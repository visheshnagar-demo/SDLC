"""Configuration settings for Sales Order ETL Pipeline."""

import os
from dataclasses import dataclass


@dataclass(frozen=True)
class PipelineConfig:
    """Pipeline runtime configuration."""

    project_id: str = os.getenv("GCP_PROJECT_ID", "upbeat-repeater-477110-q6")
    source_gcs_uri: str = os.getenv("SOURCE_GCS_URI", "gs://sdlc-workspec-store/etl/data/raw_sales_data.csv")
    destination_dataset: str = os.getenv("BIGQUERY_DATASET", "analytics")
    destination_table: str = os.getenv("BIGQUERY_TABLE", "new_sales_orders")
    log_level: str = os.getenv("LOG_LEVEL", "INFO")

    @property
    def full_destination_table_id(self) -> str:
        """Returns the fully-qualified BigQuery table ID."""
        return f"{self.project_id}.{self.destination_dataset}.{self.destination_table}"

    @property
    def dataset_table_id(self) -> str:
        """Returns dataset.table formatted name."""
        return f"{self.destination_dataset}.{self.destination_table}"


def get_config() -> PipelineConfig:
    """Factory to retrieve configuration instance."""
    return PipelineConfig()
