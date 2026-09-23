"""Cloud SQL PostgreSQL Data Extractor module.

Extracts data from Cloud SQL PostgreSQL using IAM Authentication.
Zero-mock policy: never generates dummy or placeholder data.
"""
import os
import logging
import pandas as pd
import sqlalchemy

logger = logging.getLogger("pipeline.extractor")


class ConfigError(ValueError):
    """Raised when required configuration is missing or invalid."""
    pass


class CloudSQLExtractor:
    """Extracts raw records from PostgreSQL / Google Cloud SQL instance."""

    def __init__(
        self,
        instance_connection_name: str = None,
        db_name: str = None,
        db_user: str = None,
        ip_type: str = None,
        source_table: str = None,
        db_url: str = None,
    ):
        if instance_connection_name is not None:
            self.instance_connection_name = instance_connection_name
        else:
            self.instance_connection_name = (
                os.getenv("INSTANCE_CONNECTION_NAME")
                or os.getenv("POSTGRES_INSTANCE_CONNECTION_NAME")
                or os.getenv("CLOUD_SQL_CONNECTION_NAME")
                or ""
            )

        if db_name is not None:
            self.db_name = db_name
        else:
            self.db_name = os.getenv("POSTGRES_DB") or os.getenv("DB_NAME", "postgres")

        if db_user is not None:
            self.db_user = db_user
        else:
            self.db_user = os.getenv("POSTGRES_USER") or os.getenv("DB_USER", "")

        if ip_type is not None:
            self.ip_type_str = ip_type.upper()
        else:
            self.ip_type_str = os.getenv("CLOUD_SQL_IP_TYPE", "PRIVATE").upper()

        if source_table is not None:
            self.source_table = source_table
        else:
            self.source_table = (
                os.getenv("POSTGRES_TABLE")
                or os.getenv("SOURCE_TABLE", "test_data")
            )

        if db_url is not None:
            self.db_url = db_url
        else:
            self.db_url = os.getenv("DATABASE_URL") or os.getenv("POSTGRES_URL")

    def extract(self) -> pd.DataFrame:
        """Connects to database using IAM authentication and extracts all records from source table.

        Raises:
            ConfigError / ValueError: If required connection parameters are missing.
            RuntimeError: If connection or query execution fails.
        """
        logger.info("Initializing extraction from source table '%s'...", self.source_table)
        sql_engine = None
        sql_connector = None

        if not (self.instance_connection_name and self.db_user) and not self.db_url:
            raise ConfigError(
                "FATAL: Database connection configuration missing. "
                "Must set INSTANCE_CONNECTION_NAME, POSTGRES_USER, and POSTGRES_DB for Cloud SQL IAM auth, "
                "or DATABASE_URL for direct PostgreSQL connection."
            )

        if self.instance_connection_name and self.db_user:
            try:
                from google.cloud.sql.connector import Connector, IPTypes
                logger.info(
                    "Connecting to Cloud SQL instance %s with IAM user %s (IPType=%s)",
                    self.instance_connection_name,
                    self.db_user,
                    self.ip_type_str,
                )
                sql_connector = Connector()
                _ip_type = IPTypes.PRIVATE if self.ip_type_str == "PRIVATE" else IPTypes.PUBLIC

                def _getconn():
                    return sql_connector.connect(
                        self.instance_connection_name,
                        "pg8000",
                        user=self.db_user,
                        db=self.db_name,
                        enable_iam_auth=True,  # Mandatory IAM Auth
                        ip_type=_ip_type,
                    )

                sql_engine = sqlalchemy.create_engine("postgresql+pg8000://", creator=_getconn)
            except Exception as err:
                logger.error("Failed to initialize Cloud SQL Python Connector: %s", err)
                if sql_connector is not None:
                    sql_connector.close()
                raise RuntimeError(f"Cloud SQL connector initialization failed: {err}") from err
        elif self.db_url:
            logger.info("Connecting via DATABASE_URL connection string")
            sql_engine = sqlalchemy.create_engine(self.db_url)

        query = f"SELECT * FROM {self.source_table}"
        try:
            df = pd.read_sql(query, con=sql_engine)
            logger.info("Successfully extracted %d records from '%s'", len(df), self.source_table)
            return df
        except Exception as query_err:
            logger.error("Query extraction failed on '%s': %s", self.source_table, query_err)
            raise RuntimeError(f"Database query extraction failed: {query_err}") from query_err
        finally:
            if sql_engine is not None:
                sql_engine.dispose()
            if sql_connector is not None:
                sql_connector.close()
