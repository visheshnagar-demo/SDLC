"""Extractor module for Cloud SQL PostgreSQL using IAM Database Authentication."""
import os
import logging
from typing import Optional
import pandas as pd
import sqlalchemy
from google.cloud.sql.connector import Connector, IPTypes

from src.config import PipelineConfig

logger = logging.getLogger("etl_pipeline.extractor")


class CloudSqlExtractor:
    """Extracts records from Google Cloud SQL PostgreSQL table using IAM authentication."""

    def __init__(self, config: PipelineConfig):
        self.config = config
        self._connector: Optional[Connector] = None
        self._engine: Optional[sqlalchemy.engine.Engine] = None

    def _get_connection(self):
        ip_type = IPTypes.PRIVATE if self.config.cloud_sql_ip_type == "PRIVATE" else IPTypes.PUBLIC
        if self._connector is None:
            self._connector = Connector()

        return self._connector.connect(
            self.config.instance_connection_name,
            "pg8000",
            user=self.config.db_user,
            db=self.config.db_name,
            enable_iam_auth=True,
            ip_type=ip_type,
        )

    def extract(self) -> pd.DataFrame:
        """Connects to PostgreSQL instance and extracts all records from source table."""
        logger.info(
            "Initializing Cloud SQL connection to instance '%s', database '%s' as user '%s' (IAM auth)",
            self.config.instance_connection_name,
            self.config.db_name,
            self.config.db_user,
        )

        try:
            self._engine = sqlalchemy.create_engine(
                "postgresql+pg8000://",
                creator=self._get_connection,
            )
            query = f"SELECT * FROM {self.config.source_table}"
            logger.info("Executing extraction query: %s", query)
            df = pd.read_sql(query, con=self._engine)
            logger.info("Successfully extracted %d records from '%s'", len(df), self.config.source_table)
            return df
        except Exception as exc:
            logger.error("Failed to extract data from Cloud SQL: %s", exc)
            raise RuntimeError(f"Cloud SQL extraction failed: {exc}") from exc
        finally:
            self.close()

    def close(self):
        """Releases database connections and cleans up connector resources."""
        if self._engine is not None:
            self._engine.dispose()
            self._engine = None
        if self._connector is not None:
            self._connector.close()
            self._connector = None
