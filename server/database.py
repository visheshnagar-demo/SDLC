"""Database connectivity module for Cloud SQL PostgreSQL.
Strict adherence to IAM Authentication and Zero-SQLite policy.
"""
import os
import logging
from typing import Optional, Tuple
import sqlalchemy
from sqlalchemy.engine import Engine

logger = logging.getLogger(__name__)


def get_db_engine() -> Tuple[Engine, Optional[object]]:
    """Creates a SQLAlchemy engine for PostgreSQL.
    
    Uses Cloud SQL Python Connector with IAM auth if INSTANCE_CONNECTION_NAME is configured,
    or direct connection via DATABASE_URL/POSTGRES_URL.
    
    Zero-SQLite policy: Never falls back to SQLite.
    Zero-Mock policy: Fails fast if credentials are not configured.
    """
    instance_connection_name = (
        os.getenv("INSTANCE_CONNECTION_NAME")
        or os.getenv("POSTGRES_INSTANCE_CONNECTION_NAME")
        or os.getenv("CLOUD_SQL_CONNECTION_NAME")
        or ""
    )
    user = os.getenv("POSTGRES_USER") or os.getenv("DB_USER", "")
    dbname = os.getenv("POSTGRES_DB") or os.getenv("DB_NAME", "postgres")
    db_url = os.getenv("DATABASE_URL") or os.getenv("POSTGRES_URL")

    if instance_connection_name and user:
        try:
            from google.cloud.sql.connector import Connector, IPTypes
            logger.info(
                "Initializing Cloud SQL Python Connector for %s with IAM auth (user=%s)",
                instance_connection_name,
                user,
            )
            connector = Connector()
            ip_type_str = os.getenv("CLOUD_SQL_IP_TYPE", "PRIVATE").upper()
            ip_type = IPTypes.PRIVATE if ip_type_str == "PRIVATE" else IPTypes.PUBLIC

            def getconn():
                return connector.connect(
                    instance_connection_name,
                    "pg8000",
                    user=user,
                    db=dbname,
                    enable_iam_auth=True,
                    ip_type=ip_type,
                )

            engine = sqlalchemy.create_engine("postgresql+pg8000://", creator=getconn)
            return engine, connector
        except Exception as e:
            logger.error("Failed to initialize Cloud SQL Python Connector: %s", e)
            raise RuntimeError(f"Cloud SQL connector initialization failed: {e}") from e

    if db_url:
        logger.info("Connecting to PostgreSQL via DATABASE_URL")
        engine = sqlalchemy.create_engine(db_url)
        return engine, None

    raise EnvironmentError(
        "FATAL: Missing database configuration. "
        "Provide INSTANCE_CONNECTION_NAME + POSTGRES_USER + POSTGRES_DB for Cloud SQL IAM auth, "
        "or DATABASE_URL for direct connection. SQLite fallback is strictly prohibited."
    )
