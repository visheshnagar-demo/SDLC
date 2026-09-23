"""Cloud SQL PostgreSQL Data Extractor Module with IAM Authentication."""
import os
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

logger = logging.getLogger(__name__)


class PostgresExtractor:
    """Extracts operational records from Cloud SQL PostgreSQL using IAM Authentication."""

    def __init__(
        self,
        instance_connection_name: Optional[str] = None,
        db_name: Optional[str] = None,
        db_user: Optional[str] = None,
        ip_type: Optional[str] = None
    ):
        self.instance_connection_name = (
            instance_connection_name
            or os.getenv("INSTANCE_CONNECTION_NAME")
            or os.getenv("CLOUD_SQL_INSTANCE")
        )
        self.db_name = (
            db_name
            or os.getenv("POSTGRES_DB")
            or os.getenv("DB_NAME")
        )
        self.db_user = (
            db_user
            or os.getenv("POSTGRES_USER")
            or os.getenv("DB_USER")
        )
        ip_type_val = (
            ip_type
            or os.getenv("CLOUD_SQL_IP_TYPE", "PRIVATE")
        ).upper()
        self.ip_type_str = ip_type_val

        if not self.instance_connection_name:
            raise EnvironmentError("INSTANCE_CONNECTION_NAME environment variable is required.")
        if not self.db_name:
            raise EnvironmentError("POSTGRES_DB environment variable is required.")
        if not self.db_user:
            raise EnvironmentError("POSTGRES_USER environment variable is required.")

    def _get_connection_creator(self, connector):
        ip_type_enum = getattr(IPTypes, "PRIVATE", "PRIVATE") if self.ip_type_str == "PRIVATE" else getattr(IPTypes, "PUBLIC", "PUBLIC")

        def getconn():
            return connector.connect(
                self.instance_connection_name,
                "pg8000",
                user=self.db_user,
                db=self.db_name,
                enable_iam_auth=True,
                ip_type=ip_type_enum
            )

        return getconn

    def extract(self, table_name: Optional[str] = None):
        """Extracts all records from the specified source table into a pandas DataFrame."""
        if Connector is None or sqlalchemy is None or pd is None:
            raise RuntimeError("Required database libraries (cloud-sql-python-connector, sqlalchemy, pandas) not installed.")

        target_table = table_name or os.getenv("SOURCE_TABLE", "test_data")
        logger.info(
            "Connecting to Cloud SQL instance %s, db %s, user %s (IAM enabled, ip_type: %s)...",
            self.instance_connection_name,
            self.db_name,
            self.db_user,
            self.ip_type_str
        )

        connector = Connector()
        try:
            pool = sqlalchemy.create_engine(
                "postgresql+pg8000://",
                creator=self._get_connection_creator(connector),
                pool_pre_ping=True
            )
            query = f"SELECT * FROM {target_table}"
            logger.info("Executing extraction query: %s", query)
            with pool.connect() as db_conn:
                df = pd.read_sql(sqlalchemy.text(query), db_conn)

            logger.info("Successfully extracted %d rows from table '%s'", len(df), target_table)
            return df
        finally:
            connector.close()
