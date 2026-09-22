"""PostgreSQL Source Data Extractor.

Extracts data from Cloud SQL PostgreSQL instance using IAM authentication or
direct connection credentials with schema discovery and transient retry logic.
"""
import logging
import time
from typing import Any, Dict, List, Optional, Tuple
import pandas as pd
import sqlalchemy
from sqlalchemy import text
from server.config import Settings

logger = logging.getLogger("server.extractor")


class PostgreSQLExtractor:
    """Extracts raw dataset from Cloud SQL PostgreSQL."""

    def __init__(self, settings: Settings):
        self.settings = settings
        self.engine = None
        self.connector = None

    def _init_engine(self) -> sqlalchemy.Engine:
        """Initializes SQLAlchemy Engine with Cloud SQL Connector or direct connection."""
        if self.settings.instance_connection_name and self.settings.postgres_user:
            try:
                from google.cloud.sql.connector import Connector, IPTypes
                logger.info(
                    "Connecting via Cloud SQL Python Connector (instance=%s, user=%s)",
                    self.settings.instance_connection_name,
                    self.settings.postgres_user,
                )
                self.connector = Connector()
                is_iam = not bool(self.settings.postgres_password)
                ip_type = (
                    IPTypes.PRIVATE
                    if self.settings.cloud_sql_ip_type.upper() == "PRIVATE"
                    else IPTypes.PUBLIC
                )

                def get_conn():
                    return self.connector.connect(
                        self.settings.instance_connection_name,
                        "pg8000",
                        user=self.settings.postgres_user,
                        password=self.settings.postgres_password if self.settings.postgres_password else None,
                        db=self.settings.postgres_db,
                        enable_iam_auth=is_iam,
                        ip_type=ip_type,
                    )

                return sqlalchemy.create_engine("postgresql+pg8000://", creator=get_conn)
            except (ImportError, ModuleNotFoundError) as import_err:
                logger.warning("Cloud SQL Python Connector package not available: %s", import_err)
            except Exception as conn_err:
                logger.error("Failed to initialize Cloud SQL Python Connector: %s", conn_err)
                raise

        db_url = self.settings.get_database_url_or_fail()
        if not db_url:
            raise EnvironmentError(
                "Unable to establish database connection. No valid Cloud SQL connector or connection URL available."
            )

        logger.info("Connecting via direct PostgreSQL connection URL")
        return sqlalchemy.create_engine(db_url)

    def discover_schema(self, table_name: Optional[str] = None) -> List[Dict[str, Any]]:
        """Dynamically inspects table columns and data types from information_schema."""
        tbl = table_name or self.settings.source_table
        query = text(
            "SELECT column_name, data_type, is_nullable, ordinal_position "
            "FROM information_schema.columns "
            "WHERE table_name = :tbl "
            "ORDER BY ordinal_position"
        )
        engine = self.engine or self._init_engine()
        self.engine = engine

        with engine.connect() as conn:
            result = conn.execute(query, {"tbl": tbl})
            columns = [
                {
                    "name": row[0],
                    "type": row[1],
                    "nullable": row[2] == "YES",
                    "position": row[3],
                }
                for row in result.fetchall()
            ]

        logger.info("Discovered %d columns for source table '%s': %s", len(columns), tbl, [c["name"] for c in columns])
        return columns

    def extract_data(self, table_name: Optional[str] = None) -> Tuple[pd.DataFrame, List[Dict[str, Any]]]:
        """Extracts all records from the source table with retry logic."""
        tbl = table_name or self.settings.source_table
        retries = self.settings.max_retries
        delay = self.settings.retry_delay_seconds
        last_error = None

        for attempt in range(1, retries + 1):
            try:
                if self.engine is None:
                    self.engine = self._init_engine()

                schema = self.discover_schema(tbl)
                query = f"SELECT * FROM {tbl}"
                logger.info("Extraction attempt %d/%d: Querying table '%s'", attempt, retries, tbl)

                df = pd.read_sql_query(query, con=self.engine)
                logger.info("Successfully extracted %d records from '%s'", len(df), tbl)
                return df, schema
            except Exception as exc:
                last_error = exc
                logger.warning(
                    "Extraction attempt %d failed with error: %s. Retrying in %.1fs...",
                    attempt,
                    exc,
                    delay,
                )
                if self.engine is not None:
                    try:
                        self.engine.dispose()
                    except Exception as disp_err:
                        logger.error("Error disposing engine: %s", disp_err)
                        raise
                    self.engine = None
                time.sleep(delay)
                delay *= 2.0

        logger.error("All %d extraction attempts failed for table '%s'", retries, tbl)
        raise RuntimeError(f"FATAL: Extraction failed after {retries} attempts: {last_error}") from last_error

    def close(self) -> None:
        """Disposes engine and closes Cloud SQL connector."""
        if self.engine is not None:
            self.engine.dispose()
            self.engine = None
        if self.connector is not None:
            self.connector.close()
            self.connector = None
