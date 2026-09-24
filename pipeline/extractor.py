"""Extractor module for GCS CSV and cloud data sources."""

import io
import logging
import os
import re
from typing import Optional

try:
    import pandas as pd
except ImportError:
    pd = None

try:
    from google.cloud import storage
except ImportError:
    storage = None

try:
    import sqlalchemy
except ImportError:
    sqlalchemy = None

try:
    from google.cloud.sql.connector import Connector, IPTypes
except ImportError:
    Connector = None
    IPTypes = None

from pipeline.config import PipelineConfig

logger = logging.getLogger(__name__)


class GCSExtractor:
    """Extracts raw CSV data from Google Cloud Storage or local file paths."""

    def __init__(self, project_id: Optional[str] = None, storage_client: Optional[object] = None) -> None:
        self.project_id = project_id or os.getenv("GCP_PROJECT", "upbeat-repeater-477110-q6")
        self.storage_client = storage_client

    def _get_client(self) -> object:
        if self.storage_client is not None:
            return self.storage_client
        if storage is None:
            raise ImportError("google-cloud-storage is required to extract from GCS.")
        self.storage_client = storage.Client(project=self.project_id)
        return self.storage_client

    def extract(self, source_path: str = "gs://sdlc-workspec-store/etl/data/my_file (1).csv") -> object:
        """Extract CSV file from GCS or local filesystem into a pandas DataFrame."""
        if pd is None:
            raise ImportError("pandas is required for GCSExtractor.extract.")

        if not source_path or not source_path.strip():
            raise ValueError("source_path cannot be empty.")

        source_path = source_path.strip()
        logger.info("Extracting data from source: %s", source_path)

        # Check if local file exists
        if os.path.isfile(source_path):
            logger.info("Reading from local file: %s", source_path)
            df = pd.read_csv(source_path)
            logger.info("Extracted %d rows from local file.", len(df))
            return df

        if source_path.startswith("gs://"):
            match = re.match(r"^gs://([^/]+)/(.+)$", source_path)
            if not match:
                raise ValueError(f"Invalid GCS URI format: {source_path}")

            bucket_name, blob_name = match.groups()
            client = self._get_client()
            bucket = client.bucket(bucket_name)
            blob = bucket.blob(blob_name)

            if not blob.exists():
                raise FileNotFoundError(f"GCS object not found at {source_path}")

            content_bytes = blob.download_as_bytes()
            df = pd.read_csv(io.BytesIO(content_bytes))
            logger.info("Successfully extracted %d rows from GCS URI: %s", len(df), source_path)
            return df

        # Fallback to direct read
        df = pd.read_csv(source_path)
        logger.info("Extracted %d rows from %s", len(df), source_path)
        return df


def create_cloud_sql_engine(config: PipelineConfig) -> object:
    """Create SQLAlchemy engine using Google Cloud SQL Connector with IAM authentication."""
    if Connector is None or sqlalchemy is None:
        raise ImportError("google.cloud.sql.connector and sqlalchemy are required for create_cloud_sql_engine")

    ip_type = IPTypes.PRIVATE if (IPTypes and config.cloud_sql_ip_type == "PRIVATE") else (IPTypes.PUBLIC if IPTypes else "PRIVATE")
    connector = Connector(ip_type=ip_type)

    def getconn():
        return connector.connect(
            config.instance_connection_name,
            "pg8000",
            user=config.postgres_user,
            db=config.postgres_db,
            enable_iam_auth=True,
            ip_type=ip_type,
        )

    engine = sqlalchemy.create_engine(
        "postgresql+pg8000://",
        creator=getconn,
        pool_pre_ping=True,
    )
    return engine


class PostgresExtractor:
    """Extracts data from Cloud SQL PostgreSQL."""

    def __init__(self, config: PipelineConfig, engine: Optional[object] = None):
        self.config = config
        self.engine = engine or create_cloud_sql_engine(config)

    def extract(self) -> object:
        """Extract all records from the source table into a pandas DataFrame."""
        if pd is None or sqlalchemy is None:
            raise ImportError("pandas and sqlalchemy are required for PostgresExtractor.extract")

        logger.info("Extracting data from table '%s'...", self.config.source_table)
        table_name = self.config.source_table
        if not table_name.isidentifier():
            raise ValueError(f"Invalid source table name: {table_name}")

        query = sqlalchemy.text(f"SELECT * FROM {table_name}")
        with self.engine.connect() as connection:
            df = pd.read_sql(query, con=connection)

        logger.info("Successfully extracted %d rows from '%s'.", len(df), table_name)
        return df
