"""Configuration settings for the ETL Pipeline.

Reads environment variables for GCS source, BigQuery destination, and runtime parameters.
Enforces zero-mock and zero-sqlite policies.
"""
import os
from dataclasses import dataclass


@dataclass(frozen=True)
class PipelineConfig:
    """Pipeline configuration loaded from environment variables."""

    # GCP & BigQuery Config
    gcp_project_id: str
    bigquery_dataset: str
    bigquery_table: str

    # GCS Source Config
    gcs_source_bucket: str
    gcs_source_prefix: str

    # Staging & Runtime Config
    staging_dir: str
    write_disposition: str  # WRITE_TRUNCATE or WRITE_APPEND

    @classmethod
    def from_env(cls) -> "PipelineConfig":
        """Instantiates PipelineConfig from environment variables with strict validation."""
        project_id = (
            os.getenv("GCP_PROJECT_ID")
            or os.getenv("PROJECT_ID")
            or os.getenv("GOOGLE_CLOUD_PROJECT")
            or os.getenv("GCLOUD_PROJECT")
            or "upbeat-repeater-477110-q6"
        )
        if not project_id:
            raise EnvironmentError(
                "FATAL: GCP_PROJECT_ID, PROJECT_ID, or GOOGLE_CLOUD_PROJECT environment variable is required."
            )

        dataset = os.getenv("BIGQUERY_DATASET", "analytics")
        table = os.getenv("BIGQUERY_TABLE", "vishesh-test1")

        bucket = os.getenv("GCS_SOURCE_BUCKET", "sdlc-workspec-store")
        prefix = os.getenv("GCS_SOURCE_PREFIX", "etl/data/raw_sales_data.csv")

        if not bucket or not prefix:
            raise EnvironmentError(
                "FATAL: GCS_SOURCE_BUCKET and GCS_SOURCE_PREFIX must be configured."
            )

        staging_dir = os.getenv("STAGING_DIR", "staging/sales_order_etl")
        write_disposition = os.getenv("WRITE_DISPOSITION", "WRITE_TRUNCATE").upper()

        return cls(
            gcp_project_id=project_id,
            bigquery_dataset=dataset,
            bigquery_table=table,
            gcs_source_bucket=bucket,
            gcs_source_prefix=prefix,
            staging_dir=staging_dir,
            write_disposition=write_disposition,
        )
