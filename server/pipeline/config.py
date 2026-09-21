"""Configuration settings for the GCS to BigQuery ETL pipeline."""
import os
from dataclasses import dataclass


@dataclass(frozen=True)
class PipelineConfig:
    gcp_project_id: str = os.getenv("GCP_PROJECT_ID") or os.getenv("PROJECT_ID") or "upbeat-repeater-477110-q6"
    bq_dataset: str = os.getenv("BIGQUERY_DATASET") or os.getenv("BQ_DATASET") or "analytics"
    bq_table: str = os.getenv("BIGQUERY_TABLE") or os.getenv("BQ_TABLE") or "test2"
    gcs_source_bucket: str = os.getenv("GCS_SOURCE_BUCKET") or "sdlc-workspec-store"
    gcs_source_prefix: str = os.getenv("GCS_SOURCE_PREFIX") or "etl/data/my_file (1).csv"
    gcs_source_uri: str = os.getenv("GCS_SOURCE_URI") or f"gs://{gcs_source_bucket}/{gcs_source_prefix}"
    max_error_threshold_pct: float = float(os.getenv("MAX_ERROR_THRESHOLD_PCT", "0.05"))
    pipeline_version: str = "1.0.0"

    def validate(self) -> None:
        if not self.gcp_project_id:
            raise EnvironmentError("GCP_PROJECT_ID or PROJECT_ID environment variable is required.")
        if not self.bq_dataset:
            raise EnvironmentError("BIGQUERY_DATASET environment variable is required.")
        if not self.bq_table:
            raise EnvironmentError("BIGQUERY_TABLE environment variable is required.")
        if not self.gcs_source_bucket:
            raise EnvironmentError("GCS_SOURCE_BUCKET environment variable is required.")


def get_config() -> PipelineConfig:
    cfg = PipelineConfig()
    cfg.validate()
    return cfg
