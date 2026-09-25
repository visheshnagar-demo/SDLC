"""Extractor module for Cloud SQL PostgreSQL."""
import logging
from typing import Optional
import pandas as pd
import sqlalchemy
from server.etl.config import ETLConfig

logger = logging.getLogger("server.etl.extractor")


class PostgresExtractor:
    """Extracts raw dataset from Cloud SQL PostgreSQL."""

    def __init__(self, config: ETLConfig):
        self.config = config

    def extract(self) -> pd.DataFrame:
        """Executes query on source table and returns a pandas DataFrame."""
        logger.info(
            "Starting extraction from PostgreSQL table '%s' on instance '%s'...",
            self.config.postgres_table,
            self.config.instance_connection_name,
        )

        sql_engine: Optional[sqlalchemy.Engine] = None
        sql_connector = None

        if self.config.instance_connection_name and self.config.postgres_user:
            try:
                from google.cloud.sql.connector import Connector, IPTypes

                logger.info(
                    "Connecting via Cloud SQL Python Connector (IAM Auth, user=%s, ip_type=%s)",
                    self.config.postgres_user,
                    self.config.cloud_sql_ip_type,
                )
                sql_connector = Connector()
                ip_type = (
                    IPTypes.PRIVATE
                    if self.config.cloud_sql_ip_type == "PRIVATE"
                    else IPTypes.PUBLIC
                )

                def _getconn():
                    return sql_connector.connect(
                        self.config.instance_connection_name,
                        "pg8000",
                        user=self.config.postgres_user,
                        db=self.config.postgres_db,
                        enable_iam_auth=True,  # Mandatory IAM auth
                        ip_type=ip_type,
                    )

                sql_engine = sqlalchemy.create_engine(
                    "postgresql+pg8000://", creator=_getconn
                )
            except Exception as conn_err:
                logger.error(
                    "Cloud SQL Python Connector initialization failed: %s", conn_err
                )
                raise RuntimeError(
                    f"Cloud SQL connector initialization failed: {conn_err}"
                ) from conn_err

        con_target = sql_engine if sql_engine is not None else self.config.database_url
        if not con_target:
            raise EnvironmentError(
                "FATAL: Database connection parameters missing. "
                "Provide INSTANCE_CONNECTION_NAME + POSTGRES_USER + POSTGRES_DB for Cloud SQL IAM auth, "
                "or DATABASE_URL for direct connection."
            )

        query = f"SELECT * FROM {self.config.postgres_table}"
        logger.info("Executing extraction SQL: %s", query)

        try:
            df = pd.read_sql(query, con=con_target)
            logger.info("Extracted %d records from source table.", len(df))
            return df
        finally:
            if sql_engine is not None:
                sql_engine.dispose()
            if sql_connector is not None:
                sql_connector.close()
