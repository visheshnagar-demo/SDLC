"""Extractor module for Cloud SQL PostgreSQL using IAM Authentication."""
import os
import time
from typing import Optional, Any

try:
    import pandas as pd
except ImportError:
    pd = None

try:
    from google.cloud.sql.connector import Connector, IPTypes
except ImportError:
    Connector = None
    class IPTypes:
        PRIVATE = "PRIVATE"
        PUBLIC = "PUBLIC"

try:
    import sqlalchemy
except ImportError:
    sqlalchemy = None

from server.etl.observability import logger


class CloudSQLExtractor:
    """Extracts data from Google Cloud SQL PostgreSQL using IAM authentication."""

    def __init__(
        self,
        instance_connection_name: Optional[str] = None,
        db_name: Optional[str] = None,
        user: Optional[str] = None,
        ip_type_str: Optional[str] = None,
    ):
        self.instance_connection_name = instance_connection_name or os.getenv("INSTANCE_CONNECTION_NAME")
        self.db_name = db_name or os.getenv("POSTGRES_DB", "postgres")
        self.user = user or os.getenv("POSTGRES_USER", "559906504681-compute@developer")
        ip_type_val = (ip_type_str or os.getenv("CLOUD_SQL_IP_TYPE", "PRIVATE")).upper()

        if not self.instance_connection_name:
            raise EnvironmentError(
                "INSTANCE_CONNECTION_NAME environment variable is required for Cloud SQL extraction. "
                "Ensure Cloud SQL connection details are provided."
            )
        if not self.db_name:
            raise EnvironmentError("POSTGRES_DB environment variable is required.")
        if not self.user:
            raise EnvironmentError("POSTGRES_USER environment variable is required.")

        self.ip_type = IPTypes.PRIVATE if ip_type_val == "PRIVATE" else IPTypes.PUBLIC

    def get_connection_engine(self) -> Any:
        """Create a SQLAlchemy engine connected via Cloud SQL Python Connector with IAM auth."""
        if sqlalchemy is None or Connector is None:
            raise RuntimeError("Required dependencies sqlalchemy and cloud-sql-python-connector are not installed.")

        connector = Connector()

        def getconn():
            return connector.connect(
                self.instance_connection_name,
                "pg8000",
                user=self.user,
                db=self.db_name,
                enable_iam_auth=True,
                ip_type=self.ip_type,
            )

        engine = sqlalchemy.create_engine(
            "postgresql+pg8000://",
            creator=getconn,
            pool_pre_ping=True,
            pool_recycle=1800,
        )
        return engine

    def extract_table(
        self,
        table_name: str,
        engine: Optional[Any] = None,
        max_retries: int = 3,
        backoff_sec: float = 1.0,
    ) -> Any:
        """Extract all records from target table with retry logic on transient errors."""
        if not table_name:
            raise ValueError("table_name is required for extraction.")

        logger.info(
            "Starting extraction from Cloud SQL PostgreSQL",
            table=table_name,
            instance=self.instance_connection_name,
            db=self.db_name,
            user=self.user,
            ip_type=str(self.ip_type),
        )

        if engine is None:
            engine = self.get_connection_engine()

        for attempt in range(1, max_retries + 1):
            try:
                query = f'SELECT * FROM "{table_name}"'
                if pd is None or sqlalchemy is None:
                    raise RuntimeError("pandas and sqlalchemy packages are required for extraction.")

                with engine.connect() as conn:
                    df = pd.read_sql(sqlalchemy.text(query), conn)

                logger.info(
                    "Extraction successful",
                    table=table_name,
                    rows_extracted=len(df),
                    columns=list(df.columns),
                    attempt=attempt,
                )
                return df
            except Exception as e:
                logger.warning(
                    f"Extraction attempt {attempt}/{max_retries} failed: {str(e)}",
                    attempt=attempt,
                    error=str(e),
                )
                if attempt == max_retries:
                    raise RuntimeError(
                        f"Failed to extract data from Cloud SQL table '{table_name}' after {max_retries} attempts: {e}"
                    ) from e
                sleep_time = backoff_sec * (2 ** (attempt - 1))
                time.sleep(sleep_time)
