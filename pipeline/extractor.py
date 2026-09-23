"""Extractor module for Cloud SQL PostgreSQL using IAM Authentication."""
import os
import logging

try:
    import pandas as pd
except ImportError:
    pd = None

logger = logging.getLogger(__name__)


class CloudSQLExtractor:
    """Extracts data from Cloud SQL PostgreSQL instance using Cloud SQL Connector with IAM auth."""

    def __init__(self, instance_connection_name: str = None, database: str = None, user: str = None, ip_type: str = "PRIVATE"):
        self.instance_connection_name = instance_connection_name or os.getenv("INSTANCE_CONNECTION_NAME", "")
        self.database = database or os.getenv("POSTGRES_DB", "postgres")
        self.user = user or os.getenv("POSTGRES_USER", "")
        self.ip_type = (ip_type or os.getenv("CLOUD_SQL_IP_TYPE", "PRIVATE")).upper()

    def get_connection_engine(self):
        """Creates SQLAlchemy engine with Cloud SQL Python Connector and IAM auth."""
        if not self.instance_connection_name or not self.user:
            db_url = os.getenv("DATABASE_URL") or os.getenv("POSTGRES_URL")
            if not db_url:
                raise EnvironmentError(
                    "FATAL: Database connection parameters missing. "
                    "Provide INSTANCE_CONNECTION_NAME + POSTGRES_USER + POSTGRES_DB for Cloud SQL IAM auth, "
                    "or DATABASE_URL for direct connection."
                )
            import sqlalchemy
            return sqlalchemy.create_engine(db_url), None

        try:
            import sqlalchemy
            from google.cloud.sql.connector import Connector, IPTypes

            logger.info("Initializing Cloud SQL Connector for %s (user=%s, ip=%s)", self.instance_connection_name, self.user, self.ip_type)
            connector = Connector()
            ip_type_enum = IPTypes.PRIVATE if self.ip_type == "PRIVATE" else IPTypes.PUBLIC

            def _getconn():
                return connector.connect(
                    self.instance_connection_name,
                    "pg8000",
                    user=self.user,
                    db=self.database,
                    enable_iam_auth=True,
                    ip_type=ip_type_enum,
                )

            engine = sqlalchemy.create_engine("postgresql+pg8000://", creator=_getconn)
            return engine, connector
        except Exception as err:
            logger.error("Failed to initialize Cloud SQL Connector: %s", err)
            raise RuntimeError(f"Cloud SQL connector init failed: {err}") from err

    def extract_table(self, table_name: str = "test_data"):
        """Extracts data from specified table into pandas DataFrame."""
        if pd is None:
            raise RuntimeError("pandas is required for extraction.")
        engine, connector = self.get_connection_engine()
        query = f"SELECT * FROM {table_name}"
        logger.info("Executing extraction query: %s", query)
        try:
            df = pd.read_sql(query, con=engine)
            logger.info("Extracted %d rows from %s", len(df), table_name)
            return df
        except Exception as query_err:
            logger.error("Extraction failed: %s", query_err)
            raise RuntimeError(f"PostgreSQL query extraction failed: {query_err}") from query_err
        finally:
            if engine is not None:
                engine.dispose()
            if connector is not None:
                connector.close()
