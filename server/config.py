"""Configuration settings for Cloud SQL PostgreSQL to BigQuery ETL pipeline."""
import os
from pydantic_settings import BaseSettings
from pydantic import Field


class ETLConfig(BaseSettings):
    """ETL Pipeline Configuration loaded from environment variables."""

    # GCP & BigQuery Settings
    bq_project_id: str = Field(
        default="upbeat-repeater-477110-q6",
        validation_alias="GCP_PROJECT_ID",
        description="GCP Project ID",
    )
    bq_dataset: str = Field(
        default="analytics",
        validation_alias="BIGQUERY_DATASET",
        description="BigQuery target dataset",
    )
    bq_table: str = Field(
        default="postgres_test1",
        validation_alias="BIGQUERY_TABLE",
        description="BigQuery target table",
    )
    write_disposition: str = Field(
        default="WRITE_TRUNCATE",
        validation_alias="WRITE_DISPOSITION",
        description="BigQuery write disposition (WRITE_TRUNCATE or WRITE_APPEND)",
    )

    # Cloud SQL PostgreSQL Settings
    cloud_sql_connection_name: str = Field(
        default="upbeat-repeater-477110-q6:us-central1:sdlc-etl-demo-db",
        validation_alias="INSTANCE_CONNECTION_NAME",
        description="Cloud SQL Instance Connection Name",
    )
    db_name: str = Field(
        default="postgres",
        validation_alias="POSTGRES_DB",
        description="PostgreSQL database name",
    )
    db_user: str = Field(
        default="559906504681-compute@developer",
        validation_alias="POSTGRES_USER",
        description="PostgreSQL user / IAM Service Account",
    )
    db_password: str = Field(
        default="",
        validation_alias="POSTGRES_PASSWORD",
        description="PostgreSQL password (optional for IAM auth)",
    )
    db_host: str = Field(
        default="",
        validation_alias="POSTGRES_HOST",
        description="PostgreSQL host (optional direct connection)",
    )
    db_port: int = Field(
        default=5432,
        validation_alias="POSTGRES_PORT",
        description="PostgreSQL port",
    )
    source_table: str = Field(
        default="test_data",
        validation_alias="SOURCE_TABLE",
        description="Source table in PostgreSQL",
    )
    batch_size: int = Field(
        default=10000,
        validation_alias="BATCH_SIZE",
        description="Extraction batch chunk size",
    )
    database_url: str = Field(
        default="",
        validation_alias="DATABASE_URL",
        description="Direct SQLAlchemy database connection URL (optional)",
    )

    class Config:
        env_file = ".env"
        extra = "ignore"


def get_config() -> ETLConfig:
    """Returns singleton instance of ETLConfig."""
    return ETLConfig()
