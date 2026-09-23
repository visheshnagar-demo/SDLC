"""Data extraction module for Cloud SQL PostgreSQL."""
import os
import logging
import pandas as pd

logger = logging.getLogger("pipeline.extract")


def extract_from_postgres(output_staging_file: str) -> int:
    """Extracts data from PostgreSQL source table into a Parquet staging file."""
    db_url = os.getenv("DATABASE_URL") or os.getenv("POSTGRES_URL")
    sql_engine = None
    sql_connector = None

    instance_connection_name = (
        os.getenv("INSTANCE_CONNECTION_NAME")
        or os.getenv("POSTGRES_INSTANCE_CONNECTION_NAME")
        or os.getenv("CLOUD_SQL_CONNECTION_NAME")
        or ""
    )
    host = os.getenv("POSTGRES_HOST") or os.getenv("DB_HOST", "")
    if not instance_connection_name and host and host.count(":") == 2:
        instance_connection_name = host

    user = os.getenv("POSTGRES_USER") or os.getenv("DB_USER", "")
    dbname = os.getenv("POSTGRES_DB") or os.getenv("DB_NAME", "")
    source_table = os.getenv("SOURCE_TABLE", "test_data")

    # Cloud SQL Python Connector with mandatory IAM Authentication
    if instance_connection_name and user:
        try:
            import sqlalchemy
            from google.cloud.sql.connector import Connector, IPTypes
            logger.info(
                "Connecting via Cloud SQL Python Connector for %s (IAM auth, user=%s)",
                instance_connection_name, user
            )
            sql_connector = Connector()
            _ip_type = IPTypes.PRIVATE if (os.getenv("CLOUD_SQL_IP_TYPE", "PRIVATE").upper() == "PRIVATE") else IPTypes.PUBLIC
            def _getconn():
                return sql_connector.connect(
                    instance_connection_name,
                    "pg8000",
                    user=user,
                    db=dbname,
                    enable_iam_auth=True,
                    ip_type=_ip_type,
                )
            sql_engine = sqlalchemy.create_engine("postgresql+pg8000://", creator=_getconn)
        except Exception as _conn_err:
            logger.error(
                "FATAL: Cloud SQL Python Connector initialization failed: %s. "
                "Ensure cloud-sql-python-connector is in requirements.txt and "
                "INSTANCE_CONNECTION_NAME, POSTGRES_USER, POSTGRES_DB are set correctly.",
                _conn_err
            )
            raise RuntimeError(f"Cloud SQL connector failed: {_conn_err}") from _conn_err

    con_target = sql_engine if sql_engine is not None else db_url
    if not con_target:
        raise EnvironmentError(
            "FATAL: Database connection parameters missing. "
            "Provide INSTANCE_CONNECTION_NAME + POSTGRES_USER + POSTGRES_DB for Cloud SQL IAM auth, "
            "or DATABASE_URL for direct connection. Mock dummy data is disabled."
        )

    query = f"SELECT * FROM {source_table}"
    logger.info("Executing extraction query: %s", query)
    try:
        df = pd.read_sql(query, con=con_target)
    finally:
        if sql_engine is not None:
            sql_engine.dispose()
        if sql_connector is not None:
            sql_connector.close()

    row_count = len(df)
    os.makedirs(os.path.dirname(output_staging_file), exist_ok=True)
    df.to_parquet(output_staging_file, index=False)
    logger.info("Extracted %d records to staging: %s", row_count, output_staging_file)
    return row_count
