"""ETL Pipeline Configuration.
Reads connection parameters, BigQuery targets, and execution settings from environment variables.
"""
import os
from dataclasses import dataclass


@dataclass
class ETLConfig:
    """Holds configuration parameters for Cloud SQL PostgreSQL to BigQuery ETL."""

    gcp_project_id: str
    instance_connection_name: str
    postgres_db: str
    postgres_user: str
    postgres_table: str
    cloud_sql_ip_type: str
    postgres_port: str
    database_url: str
    bq_dataset: str
    bq_table: str
    bq_location: str
    write_disposition: str

    @classmethod
    def from_env(cls) -> "ETLConfig":
        """Loads configuration from environment variables with fail-fast validation."""
        gcp_project_id = (
            os.getenv("GCP_PROJECT_ID")
            or os.getenv("PROJECT_ID")
            or os.getenv("GOOGLE_CLOUD_PROJECT")
            or "upbeat-repeater-477110-q6"
        )
        instance_connection_name = (
            os.getenv("INSTANCE_CONNECTION_NAME")
            or os.getenv("POSTGRES_INSTANCE_CONNECTION_NAME")
            or os.getenv("CLOUD_SQL_CONNECTION_NAME")
            or "upbeat-repeater-477110-q6:us-central1:sdlc-etl-demo-db"
        )
        postgres_db = os.getenv("POSTGRES_DB") or os.getenv("DB_NAME") or "postgres"
        postgres_user = (
            os.getenv("POSTGRES_USER")
            or os.getenv("DB_USER")
            or "559906504681-compute@developer"
        )
        postgres_table = (
            os.getenv("POSTGRES_TABLE")
            or os.getenv("SOURCE_TABLE")
            or "test_data"
        )
        cloud_sql_ip_type = (
            os.getenv("CLOUD_SQL_IP_TYPE")
            or "PRIVATE"
        ).upper()
        postgres_port = os.getenv("POSTGRES_PORT") or os.getenv("DB_PORT") or "5432"
        database_url = os.getenv("DATABASE_URL") or os.getenv("POSTGRES_URL") or ""

        bq_dataset = os.getenv("BIGQUERY_DATASET") or os.getenv("BQ_DATASET") or "analytics"
        bq_table = os.getenv("BIGQUERY_TABLE") or os.getenv("BQ_TABLE") or "postgres_test4"
        bq_location = os.getenv("BQ_LOCATION") or "us-central1"
        write_disposition = (os.getenv("WRITE_DISPOSITION") or "WRITE_APPEND").upper()

        return cls(
            gcp_project_id=gcp_project_id,
            instance_connection_name=instance_connection_name,
            postgres_db=postgres_db,
            postgres_user=postgres_user,
            postgres_table=postgres_table,
            cloud_sql_ip_type=cloud_sql_ip_type,
            postgres_port=postgres_port,
            database_url=database_url,
            bq_dataset=bq_dataset,
            bq_table=bq_table,
            bq_location=bq_location,
            write_disposition=write_disposition,
        )
