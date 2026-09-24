"""Configuration module for Cloud SQL PostgreSQL to BigQuery ETL pipeline."""

import os
from dataclasses import dataclass
from typing import Optional


@dataclass(frozen=True)
class PipelineConfig:
    """ETL Pipeline Configuration loaded from environment."""

    instance_connection_name: str
    postgres_db: str
    postgres_user: str
    cloud_sql_ip_type: str
    source_table: str
    gcp_project: str
    bigquery_dataset: str
    bigquery_table: str
    batch_size: int = 5000

    @classmethod
    def from_env(cls) -> "PipelineConfig":
        """Load configuration from environment variables with fail-fast validation."""
        instance_conn = os.getenv("INSTANCE_CONNECTION_NAME", "").strip()
        if not instance_conn:
            raise EnvironmentError("INSTANCE_CONNECTION_NAME environment variable is required.")

        postgres_db = os.getenv("POSTGRES_DB", "postgres").strip()
        if not postgres_db:
            raise EnvironmentError("POSTGRES_DB environment variable is required.")

        # Determine IAM postgres user
        raw_user = os.getenv("POSTGRES_USER", "").strip()
        if not raw_user:
            sa = os.getenv("GCP_SERVICE_ACCOUNT", "").strip()
            if sa:
                raw_user = sa.replace(".gserviceaccount.com", "")
        if not raw_user:
            raise EnvironmentError("POSTGRES_USER or GCP_SERVICE_ACCOUNT environment variable is required.")

        # Ensure .gserviceaccount.com is stripped for IAM auth
        postgres_user = raw_user.replace(".gserviceaccount.com", "")

        ip_type_str = os.getenv("CLOUD_SQL_IP_TYPE", "PRIVATE").strip().upper()
        if ip_type_str not in ("PRIVATE", "PUBLIC"):
            ip_type_str = "PRIVATE"

        source_table = os.getenv("SOURCE_TABLE", "test_data").strip()
        if not source_table:
            raise EnvironmentError("SOURCE_TABLE environment variable is required.")

        gcp_project = os.getenv("GCP_PROJECT", "").strip()
        if not gcp_project:
            # Fallback parse from instance_connection_name if present (project:region:instance)
            parts = instance_conn.split(":")
            if len(parts) == 3:
                gcp_project = parts[0]
            else:
                raise EnvironmentError("GCP_PROJECT environment variable is required.")

        bigquery_dataset = os.getenv("BIGQUERY_DATASET", "analytics").strip()
        if not bigquery_dataset:
            raise EnvironmentError("BIGQUERY_DATASET environment variable is required.")

        bigquery_table = os.getenv("BIGQUERY_TABLE", "postgres_test2").strip()
        if not bigquery_table:
            raise EnvironmentError("BIGQUERY_TABLE environment variable is required.")

        try:
            batch_size = int(os.getenv("BATCH_SIZE", "5000"))
        except ValueError:
            batch_size = 5000

        return cls(
            instance_connection_name=instance_conn,
            postgres_db=postgres_db,
            postgres_user=postgres_user,
            cloud_sql_ip_type=ip_type_str,
            source_table=source_table,
            gcp_project=gcp_project,
            bigquery_dataset=bigquery_dataset,
            bigquery_table=bigquery_table,
            batch_size=batch_size,
        )
