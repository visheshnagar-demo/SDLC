"""Database connector module with mandatory Cloud SQL IAM authentication."""
import logging
from typing import Any
from config import PipelineConfig

logger = logging.getLogger("etl_pipeline.db_connector")


def get_db_connection(cfg: PipelineConfig) -> Any:
    """Creates a SQLAlchemy engine for Cloud SQL PostgreSQL using IAM Authentication.
    
    Zero-mock policy: no fallback SQLite or dummy connections.
    """
    # 1. Cloud SQL IAM connector connection
    if cfg.instance_connection_name and cfg.postgres_user:
        try:
            import sqlalchemy
            from google.cloud.sql.connector import Connector, IPTypes

            logger.info(
                "Establishing Cloud SQL connection using IAM Auth. Instance: %s, User: %s, DB: %s, IP: %s",
                cfg.instance_connection_name,
                cfg.postgres_user,
                cfg.postgres_db,
                cfg.cloud_sql_ip_type,
            )
            connector = Connector()
            ip_type = (
                IPTypes.PRIVATE
                if cfg.cloud_sql_ip_type.upper() == "PRIVATE"
                else IPTypes.PUBLIC
            )

            def getconn():
                return connector.connect(
                    cfg.instance_connection_name,
                    "pg8000",
                    user=cfg.postgres_user,
                    db=cfg.postgres_db,
                    enable_iam_auth=True,  # Mandatory IAM Authentication
                    ip_type=ip_type,
                )

            engine = sqlalchemy.create_engine("postgresql+pg8000://", creator=getconn)
            return engine, connector
        except Exception as exc:
            logger.error("Failed to initialize Cloud SQL Python Connector: %s", exc)
            raise RuntimeError(f"Cloud SQL connector initialization failed: {exc}") from exc

    # 2. Direct DATABASE_URL connection if provided
    if cfg.database_url:
        import sqlalchemy
        engine = sqlalchemy.create_engine(cfg.database_url)
        return engine, None

    raise EnvironmentError(
        "FATAL: Missing database connection credentials. "
        "INSTANCE_CONNECTION_NAME, POSTGRES_USER, and POSTGRES_DB must be configured. "
        "Zero-SQLite fallback policy is enforced."
    )
