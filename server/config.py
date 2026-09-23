"""Configuration settings for the Sales Order ETL Pipeline."""
import os
from dataclasses import dataclass


@dataclass(frozen=True)
class Settings:
    gcs_source_bucket: str = os.getenv("GCS_SOURCE_BUCKET", "sdlc-workspec-store")
    gcs_source_prefix: str = os.getenv("GCS_SOURCE_PREFIX", "etl/data/raw_sales_data.csv")
    gcp_project_id: str = (
        os.getenv("GCP_PROJECT_ID")
        or os.getenv("PROJECT_ID")
        or os.getenv("GOOGLE_CLOUD_PROJECT")
        or os.getenv("GCLOUD_PROJECT", "")
    )
    bigquery_dataset: str = os.getenv("BIGQUERY_DATASET", "analytics")
    bigquery_table: str = os.getenv("BIGQUERY_TABLE", "vishesh-test1")
    write_disposition: str = os.getenv("WRITE_DISPOSITION", "WRITE_APPEND")
    circuit_breaker_error_threshold: float = float(os.getenv("CIRCUIT_BREAKER_THRESHOLD", "0.20"))

    @property
    def gcs_source_uri(self) -> str:
        return f"gs://{self.gcs_source_bucket}/{self.gcs_source_prefix}"

    @property
    def bigquery_table_id(self) -> str:
        if self.gcp_project_id:
            return f"{self.gcp_project_id}.{self.bigquery_dataset}.{self.bigquery_table}"
        return f"{self.bigquery_dataset}.{self.bigquery_table}"


config = Settings()
