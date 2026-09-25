"""ETL Pipeline Configuration."""
import os
from dataclasses import dataclass


@dataclass(frozen=True)
class ETLConfig:
    """Configuration settings for Cloud Run Job ETL execution."""
    gcs_bucket_name: str = os.getenv("GCS_BUCKET_NAME") or os.getenv("GCS_SOURCE_BUCKET") or "sdlc-workspec-store"
    gcs_source_blob: str = os.getenv("GCS_SOURCE_BLOB") or os.getenv("GCS_SOURCE_PREFIX") or "etl/data/raw_sales_data.csv"
    gcp_project_id: str = (
        os.getenv("GCP_PROJECT_ID")
        or os.getenv("PROJECT_ID")
        or os.getenv("GOOGLE_CLOUD_PROJECT")
        or "upbeat-repeater-477110-q6"
    )
    bq_dataset_id: str = os.getenv("BQ_DATASET_ID") or os.getenv("BIGQUERY_DATASET") or "analytics"
    bq_table_id: str = os.getenv("BQ_TABLE_ID") or os.getenv("BIGQUERY_TABLE") or "harshada-test4"
    bq_location: str = os.getenv("BQ_LOCATION", "us-central1")
    write_mode: str = os.getenv("WRITE_MODE", "append").lower()
    log_level: str = os.getenv("LOG_LEVEL", "INFO").upper()

    @property
    def target_table_ref(self) -> str:
        return f"{self.gcp_project_id}.{self.bq_dataset_id}.{self.bq_table_id}"
