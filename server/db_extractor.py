import logging
import os
import time
from typing import Optional
import pandas as pd
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.engine import Engine

from server.config import settings

logger = logging.getLogger("etl.extractor")


def get_cloud_sql_engine(
    instance_connection_name: Optional[str] = None,
    db_user: Optional[str] = None,
    db_name: Optional[str] = None,
    enable_iam_auth: bool = True,
) -> Engine:
    """Creates a SQLAlchemy Engine connected to Cloud SQL PostgreSQL using IAM or connection URL."""
    inst_name = instance_connection_name or settings.INSTANCE_CONNECTION_NAME
    user = db_user or settings.DB_USER
    database = db_name or settings.DB_NAME

    # Check for direct database URL override (e.g. for testing / local sqlite/postgres)
    db_url_override = os.getenv("SOURCE_DB_URL") or os.getenv("POSTGRES_DB_URL")
    if db_url_override:
        return create_engine(db_url_override)

    try:
        from google.cloud.sql.connector import Connector, IPTypes

        connector = Connector()

        def getconn():
            conn = connector.connect(
                inst_name,
                "pg8000",
                user=user,
                db=database,
                enable_iam_auth=enable_iam_auth,
                ip_type=IPTypes.PUBLIC,
            )
            return conn

        engine = create_engine(
            "postgresql+pg8000://",
            creator=getconn,
        )
        return engine
    except Exception as e:
        logger.warning(
            "Cloud SQL connector initialization fallback: %s. Using default engine.", e
        )
        fallback_url = os.getenv("DATABASE_URL", "sqlite:////tmp/source.db")
        return create_engine(fallback_url)


class PostgresExtractor:
    def __init__(
        self, engine: Optional[Engine] = None, table_name: Optional[str] = None
    ):
        self.engine = engine or get_cloud_sql_engine()
        self.table_name = table_name or settings.SOURCE_TABLE

    def discover_schema(self) -> list[dict]:
        """Discovers column names and data types from the source table."""
        inspector = inspect(self.engine)
        columns = inspector.get_columns(self.table_name)
        schema_info = [
            {
                "name": col["name"],
                "type": str(col["type"]),
                "nullable": col.get("nullable", True),
            }
            for col in columns
        ]
        return schema_info

    def extract(self, max_retries: int = 3, retry_delay: float = 1.0) -> pd.DataFrame:
        """Extracts all data from the source table with retry logic."""
        last_exception = None
        for attempt in range(1, max_retries + 1):
            try:
                logger.info(
                    "Extracting from table '%s' (attempt %d/%d)...",
                    self.table_name,
                    attempt,
                    max_retries,
                )
                query = text(f"SELECT * FROM {self.table_name}")
                with self.engine.connect() as conn:
                    df = pd.read_sql(query, conn)
                logger.info("Successfully extracted %d records.", len(df))
                return df
            except Exception as e:
                last_exception = e
                logger.warning(
                    "Extraction attempt %d failed: %s. Retrying in %.1fs...",
                    attempt,
                    e,
                    retry_delay,
                )
                time.sleep(retry_delay)
                retry_delay *= 2

        raise RuntimeError(
            f"Failed to extract data from {self.table_name} after {max_retries} attempts: {last_exception}"
        ) from last_exception
