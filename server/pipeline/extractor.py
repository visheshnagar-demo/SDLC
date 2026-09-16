"""Postgres Extractor module for querying raw sales orders."""
import os
import logging
from datetime import datetime, timezone
from typing import Any

try:
    import pandas as pd
except ImportError:
    pd = None

logger = logging.getLogger("server.pipeline.extractor")


class PostgresExtractor:
    """Extracts raw sales orders from PostgreSQL source table."""

    def __init__(self, table_name: str = "raw_sales_orders"):
        self.table_name = table_name

    def get_connection_url(self) -> str:
        db_url = (
            os.getenv("DATABASE_URL")
            or os.getenv("POSTGRES_DB_URL")
            or os.getenv("POSTGRES_URL")
        )
        if not db_url:
            host = os.getenv("POSTGRES_HOST") or os.getenv("DB_HOST", "")
            port = os.getenv("POSTGRES_PORT") or os.getenv("DB_PORT", "5432")
            user = os.getenv("POSTGRES_USER") or os.getenv("DB_USER", "")
            password = os.getenv("POSTGRES_PASSWORD") or os.getenv("DB_PASSWORD", "")
            dbname = os.getenv("POSTGRES_DB") or os.getenv("DB_NAME", "")
            if user and host and dbname:
                db_url = f"postgresql://{user}:{password}@{host}:{port}/{dbname}"

        if not db_url:
            raise EnvironmentError(
                "FATAL: DATABASE_URL, POSTGRES_DB_URL, or POSTGRES_* connection environment variables "
                "must be configured. Mock dummy data generation is completely disabled."
            )
        return db_url

    def extract(self) -> Any:
        if pd is None:
            raise RuntimeError("FATAL: pandas is required for pipeline extraction.")
        db_url = self.get_connection_url()
        query = f"SELECT * FROM {self.table_name}"
        logger.info("Executing extraction query against PostgreSQL: %s", query)
        df = pd.read_sql(query, con=db_url)
        df["extracted_at"] = datetime.now(timezone.utc)
        logger.info(
            "Extracted %d raw records from PostgreSQL table %s",
            len(df),
            self.table_name,
        )
        return df
