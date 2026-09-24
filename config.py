"""Configuration module for Cloud SQL PostgreSQL to BigQuery ETL Pipeline."""
import os
from dataclasses import dataclass


@dataclass(frozen=True)
class PipelineConfig:
    # Source DB Configuration
    instance_connection_name: str = os.getenv(
        "INSTANCE_CONNECTION_NAME",
        "upbeat-repeater-477110-q6:us-central1:sdlc-etl-demo-db"
    )
    postgres_db: str = os.getenv("POSTGRES_DB", "postgres")
    postgres_user: str = os.getenv(
        "POSTGRES_USER",
        "559906504681-compute@developer"
    )
    postgres_port: str = os.getenv("POSTGRES_PORT", "5432")
    cloud_sql_ip_type: str = os.getenv("CLOUD_SQL_IP_TYPE", "PRIVATE")
    database_url: str = os.getenv("DATABASE_URL", "")
    source_table: str = os.getenv("SOURCE_TABLE", "test_data")

    # BigQuery Target Configuration
    gcp_project_id: str = os.getenv("GCP_PROJECT_ID", "upbeat-repeater-477110-q6")
    bigquery_dataset: str = os.getenv("BIGQUERY_DATASET", "analytics")
    bigquery_table: str = os.getenv("BIGQUERY_TABLE", "postgres_test2")
    bq_location: str = os.getenv("BQ_LOCATION", "us-central1")
    write_disposition: str = os.getenv("WRITE_DISPOSITION", "WRITE_APPEND")

    # Staging & Runtime
    staging_dir: str = os.getenv("STAGING_DIR", "staging")
    schema_path: str = os.getenv("SCHEMA_PATH", "schemas/postgres_test2_schema.json")
    max_rejection_rate: float = float(os.getenv("MAX_REJECTION_RATE", "0.05"))


def get_config() -> PipelineConfig:
    return PipelineConfig()
