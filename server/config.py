"""Configuration module for SCRUM-322 ETL Pipeline."""

import os
from dataclasses import dataclass
from urllib.parse import urlparse, unquote


@dataclass(frozen=True)
class PipelineConfig:
    """Configuration parameters for GCS to BigQuery ETL pipeline."""

    gcs_source_uri: str = os.getenv(
        "GCS_SOURCE_URI",
        "gs://sdlc-workspec-store/etl/data/my_file (1).csv",
    )
    bq_project_id: str = os.getenv(
        "BQ_PROJECT_ID",
        os.getenv("GCP_PROJECT", "upbeat-repeater-477110-q6"),
    )
    bq_dataset_id: str = os.getenv("BQ_DATASET_ID", "analytics")
    bq_table_id: str = os.getenv("BQ_TABLE_ID", "viswa")
    bq_location: str = os.getenv("BQ_LOCATION", "US")
    write_disposition: str = os.getenv("WRITE_DISPOSITION", "WRITE_TRUNCATE")
    circuit_breaker_max_error_ratio: float = float(
        os.getenv("CIRCUIT_BREAKER_MAX_ERROR_RATIO", "0.0")
    )
    log_level: str = os.getenv("LOG_LEVEL", "INFO")

    @property
    def full_target_table_id(self) -> str:
        """Returns fully-qualified BigQuery table ID."""
        return f"{self.bq_project_id}.{self.bq_dataset_id}.{self.bq_table_id}"

    def parse_gcs_uri(self) -> tuple[str, str]:
        """Parses bucket name and unquoted blob path from gs:// URI."""
        if not self.gcs_source_uri.startswith("gs://"):
            raise ValueError(f"Invalid GCS URI: {self.gcs_source_uri}. Must start with 'gs://'")
        parsed = urlparse(self.gcs_source_uri)
        bucket_name = parsed.netloc
        blob_name = unquote(parsed.path.lstrip("/"))
        if not bucket_name or not blob_name:
            raise ValueError(f"Invalid GCS URI components: bucket='{bucket_name}', blob='{blob_name}'")
        return bucket_name, blob_name


config = PipelineConfig()
