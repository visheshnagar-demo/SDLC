"""PostgreSQL Extractor Module."""
import os
import pandas as pd
from server.etl.logger import get_logger

logger = get_logger("extractor")


def extract_from_postgres(
    table_name: str = "test_data",
    schema_name: str = "public",
    batch_size: int = 5000,
) -> pd.DataFrame:
    """Extracts raw data from PostgreSQL database into a pandas DataFrame.
    
    Zero-mock policy: connects to real PostgreSQL / Cloud SQL and fails fast if unavailable.
    """
    logger.info("Extracting data from PostgreSQL table: %s.%s", schema_name, table_name)
    
    db_url = os.getenv("DATABASE_URL") or os.getenv("POSTGRES_URL")
    sql_engine = None
    sql_connector = None

    instance_connection_name = (
        os.getenv("INSTANCE_CONNECTION_NAME")
        or os.getenv("POSTGRES_INSTANCE_CONNECTION_NAME")
        or os.getenv("CLOUD_SQL_CONNECTION_NAME")
        or "upbeat-repeater-477110-q6:us-central1:sdlc-etl-demo-db"
    )
    host = os.getenv("POSTGRES_HOST") or os.getenv("DB_HOST", "")
    if not instance_connection_name and host and host.count(":") == 2:
        instance_connection_name = host
        host = ""

    user = os.getenv("POSTGRES_USER") or os.getenv("DB_USER", "559906504681-compute@developer")
    dbname = os.getenv("POSTGRES_DB") or os.getenv("DB_NAME", "postgre")

    if instance_connection_name and user:
        try:
            import sqlalchemy
            from google.cloud.sql.connector import Connector, IPTypes
            logger.info(
                "Connecting via Cloud SQL Python Connector for %s (IAM auth, user=%s)",
                instance_connection_name, user
            )
            sql_connector = Connector()
            _ip_type = (
                IPTypes.PRIVATE
                if (os.getenv("CLOUD_SQL_IP_TYPE", "PRIVATE").upper() == "PRIVATE")
                else IPTypes.PUBLIC
            )
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
            logger.error("Cloud SQL Python Connector initialization failed: %s", _conn_err)
            raise RuntimeError(f"Cloud SQL connector failed: {_conn_err}") from _conn_err

    con_target = sql_engine if sql_engine is not None else db_url
    if not con_target:
        raise EnvironmentError(
            "Database connection parameters missing. "
            "Set INSTANCE_CONNECTION_NAME + POSTGRES_USER + POSTGRES_DB or DATABASE_URL."
        )

    query = f"SELECT * FROM {table_name}"
    try:
        df = pd.read_sql(query, con=con_target)
        logger.info("Successfully extracted %d rows from PostgreSQL", len(df))
        return df
    finally:
        if sql_engine is not None:
            sql_engine.dispose()
        if sql_connector is not None:
            sql_connector.close()
