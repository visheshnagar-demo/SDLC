"""Database connector module for Google Cloud SQL PostgreSQL using IAM Authentication."""
import os
import sqlalchemy
from google.cloud.sql.connector import Connector, IPTypes
from config import config
from pipeline.observability import logger


class CloudSQLPostgresConnector:
    """Manages secure IAM connections to Cloud SQL PostgreSQL."""

    def __init__(self):
        self.instance_connection_name = config.instance_connection_name
        self.db_user = config.db_user
        self.db_name = config.db_name
        self.ip_type_str = config.cloud_sql_ip_type
        self.database_url = config.database_url
        self._connector = None
        self._engine = None

    def get_engine(self) -> sqlalchemy.engine.Engine:
        """Initializes and returns a SQLAlchemy engine."""
        if self.database_url:
            logger.info("Connecting via DATABASE_URL environment variable.")
            self._engine = sqlalchemy.create_engine(self.database_url)
            return self._engine

        if not self.instance_connection_name or not self.db_user:
            raise EnvironmentError(
                "FATAL: Missing Cloud SQL connection parameters. "
                "INSTANCE_CONNECTION_NAME and POSTGRES_USER are required."
            )

        logger.info(
            "Connecting to Cloud SQL instance '%s' with user '%s' (IAM auth, IP=%s)",
            self.instance_connection_name,
            self.db_user,
            self.ip_type_str,
        )

        self._connector = Connector()
        ip_type = (
            IPTypes.PRIVATE
            if self.ip_type_str.upper() == "PRIVATE"
            else IPTypes.PUBLIC
        )

        def get_conn():
            return self._connector.connect(
                self.instance_connection_name,
                "pg8000",
                user=self.db_user,
                db=self.db_name,
                enable_iam_auth=True,
                ip_type=ip_type,
            )

        self._engine = sqlalchemy.create_engine(
            "postgresql+pg8000://",
            creator=get_conn,
            pool_pre_ping=True,
        )
        return self._engine

    def close(self) -> None:
        """Closes active engine and Cloud SQL connector."""
        if self._engine is not None:
            self._engine.dispose()
        if self._connector is not None:
            self._connector.close()
