"""ETL Configuration Module.
Loads settings from environment variables with zero fallback to SQLite.
"""
import os
from dataclasses import dataclass
from typing import Optional


@dataclass
class Settings:
    # GCP Infrastructure Settings
    gcp_project_id: str = os.getenv("GCP_PROJECT_ID", "upbeat-repeater-477110-q6")
    gcp_region: str = os.getenv("GCP_REGION", "us-central1")
    bq_location: str = os.getenv("BQ_LOCATION", "us-central1")

    # Cloud SQL PostgreSQL Source
    instance_connection_name: str = os.getenv(
        "INSTANCE_CONNECTION_NAME",
        os.getenv("POSTGRES_INSTANCE_CONNECTION_NAME", "upbeat-repeater-477110-q6:us-central1:sdlc-etl-demo-db")
    )
    postgres_db: str = os.getenv("POSTGRES_DB", os.getenv("DB_NAME", "postgres"))
    postgres_user: str = os.getenv(
        "POSTGRES_USER",
        os.getenv("DB_USER", "559906504681-compute@developer")
    )
    cloud_sql_ip_type: str = os.getenv("CLOUD_SQL_IP_TYPE", "PRIVATE")
    postgres_port: int = int(os.getenv("POSTGRES_PORT", os.getenv("DB_PORT", "5432")))
    postgres_host: str = os.getenv("POSTGRES_HOST", os.getenv("DB_HOST", ""))
    database_url: Optional[str] = os.getenv("DATABASE_URL", os.getenv("POSTGRES_URL"))
    source_table: str = os.getenv("SOURCE_TABLE", "test_data")

    # BigQuery Target Sink
    bigquery_dataset: str = os.getenv("BIGQUERY_DATASET", os.getenv("BQ_DATASET", "analytics"))
    bigquery_table: str = os.getenv("BIGQUERY_TABLE", os.getenv("BQ_TABLE", "postgres_test3"))
    write_mode: str = os.getenv("WRITE_MODE", "overwrite")


def get_settings() -> Settings:
    """Return an instantiated Settings object."""
    return Settings()
