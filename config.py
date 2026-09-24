"""Configuration module for Cloud SQL PostgreSQL to BigQuery ETL Pipeline."""
import os
from dataclasses import dataclass


@dataclass(frozen=True)
class PipelineConfig:
    """ETL Pipeline Configuration settings loaded from environment variables."""

    # GCP & Project Settings
    gcp_project_id: str = os.getenv("GCP_PROJECT_ID", "upbeat-repeater-477110-q6")
    gcp_region: str = os.getenv("GCP_REGION", "us-central1")

    # Cloud SQL PostgreSQL Source Settings
    instance_connection_name: str = os.getenv(
        "INSTANCE_CONNECTION_NAME",
        "upbeat-repeater-477110-q6:us-central1:sdlc-etl-demo-db",
    )
    db_name: str = os.getenv("POSTGRES_DB", os.getenv("DB_NAME", "postgres"))
    db_user: str = os.getenv("POSTGRES_USER", os.getenv("DB_USER", "559906504681-compute@developer"))
    cloud_sql_ip_type: str = os.getenv("CLOUD_SQL_IP_TYPE", "PRIVATE")
    source_table: str = os.getenv("SOURCE_TABLE", "test_data")
    database_url: str = os.getenv("DATABASE_URL", "")

    # BigQuery Target Settings
    target_dataset: str = os.getenv("BIGQUERY_DATASET", os.getenv("TARGET_DATASET", "analytics"))
    target_table: str = os.getenv("BIGQUERY_TABLE", os.getenv("TARGET_TABLE", "postgres_test2"))
    bq_location: str = os.getenv("BQ_LOCATION", "us-central1")
    write_mode: str = os.getenv("WRITE_MODE", "append")


config = PipelineConfig()
