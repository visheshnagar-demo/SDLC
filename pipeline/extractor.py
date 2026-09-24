"""Extractor module for Cloud SQL PostgreSQL using Cloud SQL Python Connector and IAM auth."""

import logging
from typing import Optional

try:
    import pandas as pd
except ImportError:
    pd = None

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

        logger.info(f"Extracting data from table '{self.config.source_table}'...")
        table_name = self.config.source_table
        if not table_name.isidentifier():
            raise ValueError(f"Invalid source table name: {table_name}")

        query = sqlalchemy.text(f"SELECT * FROM {table_name}")
        with self.engine.connect() as connection:
            df = pd.read_sql(query, con=connection)

        logger.info(f"Successfully extracted {len(df)} rows from '{table_name}'.")
        return df


class GCSExtractor:
    """Compatibility alias if needed."""
    pass
