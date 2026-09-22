"""ETL Pipeline Configuration Manager.

Loads runtime parameters, Cloud SQL PostgreSQL connection settings, BigQuery
target metadata, and validation thresholds from environment variables.
"""
import os
from typing import Optional
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings with environment variable bindings."""
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # Cloud SQL PostgreSQL Source Configuration
    instance_connection_name: str = Field(
        default="upbeat-repeater-477110-q6:us-central1:sdlc-etl-demo-db",
        alias="INSTANCE_CONNECTION_NAME",
    )
    postgres_db: str = Field(default="postgres", alias="POSTGRES_DB")
    postgres_user: str = Field(
        default="559906504681-compute@developer",
        alias="POSTGRES_USER",
    )
    postgres_password: Optional[str] = Field(default=None, alias="POSTGRES_PASSWORD")
    postgres_host: Optional[str] = Field(default=None, alias="POSTGRES_HOST")
    postgres_port: int = Field(default=5432, alias="POSTGRES_PORT")
    source_table: str = Field(default="test_data", alias="SOURCE_TABLE")
    database_url: Optional[str] = Field(default=None, alias="DATABASE_URL")
    cloud_sql_ip_type: str = Field(default="PUBLIC", alias="CLOUD_SQL_IP_TYPE")

    # Google BigQuery Target Configuration
    gcp_project_id: str = Field(
        default="upbeat-repeater-477110-q6",
        alias="GCP_PROJECT_ID",
    )
    bigquery_dataset: str = Field(default="analytics", alias="BIGQUERY_DATASET")
    bigquery_table: str = Field(default="postgres_test1", alias="BIGQUERY_TABLE")
    write_disposition: str = Field(default="WRITE_TRUNCATE", alias="WRITE_DISPOSITION")

    # Execution & Quality Controls
    circuit_breaker_threshold: float = Field(default=0.05, alias="CIRCUIT_BREAKER_THRESHOLD")
    max_retries: int = Field(default=3, alias="MAX_RETRIES")
    retry_delay_seconds: float = Field(default=2.0, alias="RETRY_DELAY_SECONDS")
    batch_size: int = Field(default=50000, alias="BATCH_SIZE")

    def get_database_url_or_fail(self) -> str:
        """Constructs or returns PostgreSQL database URL.
        
        Zero-SQLite policy: Never falls back to SQLite. Fails fast if connection
        parameters are missing.
        """
        if self.database_url:
            if "sqlite" in self.database_url.lower():
                raise EnvironmentError("SQLite database URL is prohibited in production ETL pipelines.")
            return self.database_url

        if self.postgres_host and self.postgres_user and self.postgres_db:
            pw = f":{self.postgres_password}" if self.postgres_password else ""
            return f"postgresql://{self.postgres_user}{pw}@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"

        if not self.instance_connection_name:
            raise EnvironmentError(
                "Missing required Cloud SQL connection parameters. "
                "Provide INSTANCE_CONNECTION_NAME or POSTGRES_HOST / DATABASE_URL."
            )
        return ""


def get_settings() -> Settings:
    """Instantiates and returns the application settings."""
    return Settings()
