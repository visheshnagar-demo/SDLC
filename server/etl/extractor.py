"""Data Extraction Module for PostgreSQL / Cloud SQL.
Extracts source records using Cloud SQL Python Connector with IAM Auth.
Zero-mock policy: never generates synthetic data, fails fast on connection errors.
"""
import logging
from typing import Optional
import pandas as pd
from server.etl.config import Settings, get_settings

logger = logging.getLogger("server.etl.extractor")


def get_postgres_engine(settings: Optional[Settings] = None):
    """Initializes SQLAlchemy engine using Cloud SQL Connector with IAM Auth or connection URL."""
    if settings is None:
        settings = get_settings()

    sql_connector = None
    if settings.instance_connection_name and settings.postgres_user:
        try:
            import sqlalchemy
            from google.cloud.sql.connector import Connector, IPTypes

            logger.info(
                "Configuring Cloud SQL Python Connector for %s (IAM auth, user=%s, ip_type=%s)",
                settings.instance_connection_name,
                settings.postgres_user,
                settings.cloud_sql_ip_type,
            )
            sql_connector = Connector()
            ip_type_enum = (
                IPTypes.PRIVATE
                if settings.cloud_sql_ip_type.upper() == "PRIVATE"
                else IPTypes.PUBLIC
            )

            def _getconn():
                return sql_connector.connect(
                    settings.instance_connection_name,
                    "pg8000",
                    user=settings.postgres_user,
                    db=settings.postgres_db,
                    enable_iam_auth=True,  # Mandatory IAM auth
                    ip_type=ip_type_enum,
                )

            engine = sqlalchemy.create_engine("postgresql+pg8000://", creator=_getconn)
            return engine, sql_connector
        except Exception as exc:
            logger.error("Cloud SQL Connector engine creation failed: %s", exc)
            raise RuntimeError(f"Failed to create Cloud SQL engine: {exc}") from exc

    if settings.database_url:
        import sqlalchemy
        logger.info("Configuring SQLAlchemy engine from DATABASE_URL")
        return sqlalchemy.create_engine(settings.database_url), None

    raise EnvironmentError(
        "FATAL: Database connection parameters missing. "
        "Provide INSTANCE_CONNECTION_NAME + POSTGRES_USER + POSTGRES_DB for Cloud SQL IAM auth, "
        "or DATABASE_URL for direct connection."
    )


def extract_postgres_data(settings: Optional[Settings] = None) -> pd.DataFrame:
    """Extracts raw records from Cloud SQL PostgreSQL source table into a pandas DataFrame."""
    if settings is None:
        settings = get_settings()

    logger.info("Initiating PostgreSQL extraction for table '%s'...", settings.source_table)
    engine, connector = get_postgres_engine(settings)

    query = f"SELECT * FROM {settings.source_table}"
    try:
        df = pd.read_sql(query, con=engine)
        logger.info("Successfully extracted %d records from '%s'", len(df), settings.source_table)
        return df
    except Exception as exc:
        logger.error("Failed executing query '%s': %s", query, exc)
        raise RuntimeError(f"PostgreSQL extraction failed: {exc}") from exc
    finally:
        if engine is not None:
            engine.dispose()
        if connector is not None:
            connector.close()
