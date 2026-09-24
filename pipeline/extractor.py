import os
from typing import Any, Generator, Optional
from pipeline.logger import get_logger

try:
    import pandas as pd
except ImportError:
    pd = None

try:
    from sqlalchemy import create_engine
except ImportError:
    create_engine = None

try:
    from google.cloud.sql.connector import Connector, IPTypes
except ImportError:
    Connector = None
    IPTypes = None

logger = get_logger("extractor")


def get_cloud_sql_engine():
    """Initializes a SQLAlchemy engine using Google Cloud SQL Connector with IAM database authentication."""
    instance_connection_name = os.getenv("INSTANCE_CONNECTION_NAME")
    postgres_db = os.getenv("POSTGRES_DB", "postgres")
    postgres_user = os.getenv("POSTGRES_USER")
    ip_type_str = os.getenv("CLOUD_SQL_IP_TYPE", "PRIVATE").upper()

    if not instance_connection_name:
        raise EnvironmentError(
            "Missing required environment variable 'INSTANCE_CONNECTION_NAME' for Cloud SQL connection."
        )
    if not postgres_user:
        raise EnvironmentError(
            "Missing required environment variable 'POSTGRES_USER' for Cloud SQL IAM authentication."
        )

    if Connector is None or create_engine is None:
        raise RuntimeError("cloud-sql-python-connector and sqlalchemy must be installed to connect to Cloud SQL.")

    ip_type = IPTypes.PRIVATE if (IPTypes and ip_type_str == "PRIVATE") else (IPTypes.PUBLIC if IPTypes else None)
    connector = Connector()

    def getconn():
        return connector.connect(
            instance_connection_name,
            "pg8000",
            user=postgres_user,
            db=postgres_db,
            enable_iam_auth=True,
            ip_type=ip_type,
        )

    engine = create_engine(
        "postgresql+pg8000://",
        creator=getconn,
    )
    return engine, connector


def extract_data(
    table_name: Optional[str] = None,
    chunk_size: Optional[int] = None,
    engine: Any = None,
) -> Any:
    """Extracts data from the source PostgreSQL table into a DataFrame or list of records.

    Raises EnvironmentError / RuntimeError on connection or extraction failures (fail-fast).
    """
    if not table_name:
        table_name = os.getenv("SOURCE_TABLE", "test_data")
    if not table_name:
        raise EnvironmentError("No source table specified via argument or SOURCE_TABLE environment variable.")

    connector_to_close = None
    if engine is None:
        database_url = os.getenv("DATABASE_URL") or os.getenv("POSTGRES_URL")
        if database_url:
            if create_engine is None:
                raise RuntimeError("sqlalchemy must be installed to connect via database URL.")
            engine = create_engine(database_url)
        else:
            engine, connector_to_close = get_cloud_sql_engine()

    try:
        query = f"SELECT * FROM {table_name}"
        logger.info(f"Extracting records from table '{table_name}'...")
        if pd is not None:
            with engine.connect() as conn:
                df = pd.read_sql(query, conn)
            logger.info(f"Successfully extracted {len(df)} records from '{table_name}'.")
            return df
        else:
            with engine.connect() as conn:
                result = conn.execute(query)
                records = [dict(row._mapping) for row in result]
            logger.info(f"Successfully extracted {len(records)} records from '{table_name}'.")
            return records
    except Exception as exc:
        logger.error(f"Failed to extract data from table '{table_name}': {exc}")
        raise RuntimeError(f"Extraction failed for table '{table_name}': {exc}") from exc
    finally:
        if connector_to_close is not None:
            connector_to_close.close()


def extract_data_chunks(
    table_name: Optional[str] = None,
    chunk_size: int = 10000,
    engine: Any = None,
) -> Generator[Any, None, None]:
    """Extracts data in chunks from PostgreSQL to support memory-efficient streaming."""
    if not table_name:
        table_name = os.getenv("SOURCE_TABLE", "test_data")
    if not table_name:
        raise EnvironmentError("No source table specified via argument or SOURCE_TABLE environment variable.")

    connector_to_close = None
    if engine is None:
        database_url = os.getenv("DATABASE_URL") or os.getenv("POSTGRES_URL")
        if database_url:
            if create_engine is None:
                raise RuntimeError("sqlalchemy must be installed to connect via database URL.")
            engine = create_engine(database_url)
        else:
            engine, connector_to_close = get_cloud_sql_engine()

    try:
        query = f"SELECT * FROM {table_name}"
        with engine.connect() as conn:
            if pd is not None:
                for chunk_df in pd.read_sql(query, conn, chunksize=chunk_size):
                    yield chunk_df
            else:
                result = conn.execute(query)
                while True:
                    rows = result.fetchmany(chunk_size)
                    if not rows:
                        break
                    yield [dict(r._mapping) for r in rows]
    except Exception as exc:
        logger.error(f"Failed during chunked extraction: {exc}")
        raise RuntimeError(f"Chunked extraction failed for table '{table_name}': {exc}") from exc
    finally:
        if connector_to_close is not None:
            connector_to_close.close()
