"""Configuration module for Cloud SQL PostgreSQL to BigQuery ETL Pipeline."""
import os
from dataclasses import dataclass


@dataclass(frozen=True)
class PipelineConfig:
    """Pipeline configuration parameters resolved from environment variables."""
    gcp_project: str
    instance_connection_name: str
    db_name: str
    db_user: str
    source_table: str
    bq_dataset: str
    bq_table: str
    cloud_sql_ip_type: str = "PRIVATE"
    postgres_port: str = "5432"
    log_level: str = "INFO"

    @classmethod
    def from_env(cls) -> "PipelineConfig":
        """Loads and validates configuration from environment variables."""
        gcp_project = (
            os.getenv("GCP_PROJECT_ID")
            or os.getenv("GCP_PROJECT")
            or os.getenv("PROJECT_ID")
            or "upbeat-repeater-477110-q6"
        )
        instance_connection_name = (
            os.getenv("INSTANCE_CONNECTION_NAME")
            or os.getenv("POSTGRES_INSTANCE_CONNECTION_NAME")
            or "upbeat-repeater-477110-q6:us-central1:sdlc-etldemo-db"
        )
        db_name = os.getenv("POSTGRES_DB") or os.getenv("DB_NAME") or "postgres"
        db_user = (
            os.getenv("POSTGRES_USER")
            or os.getenv("DB_USER")
            or "559906504681-compute@developer"
        )
        source_table = os.getenv("SOURCE_TABLE") or "kttest_data"
        bq_dataset = os.getenv("BIGQUERY_DATASET") or os.getenv("BQ_DATASET") or "analytics"
        bq_table = os.getenv("BIGQUERY_TABLE") or os.getenv("BQ_TABLE") or "postgres_test2"
        cloud_sql_ip_type = os.getenv("CLOUD_SQL_IP_TYPE", "PRIVATE").upper()
        postgres_port = os.getenv("POSTGRES_PORT") or os.getenv("DB_PORT") or "5432"
        log_level = os.getenv("LOG_LEVEL", "INFO")

        return cls(
            gcp_project=gcp_project,
            instance_connection_name=instance_connection_name,
            db_name=db_name,
            db_user=db_user,
            source_table=source_table,
            bq_dataset=bq_dataset,
            bq_table=bq_table,
            cloud_sql_ip_type=cloud_sql_ip_type,
            postgres_port=postgres_port,
            log_level=log_level,
        )
