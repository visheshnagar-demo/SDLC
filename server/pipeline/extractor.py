"""PostgreSQL and Cloud SQL extractor engine."""
import os
import urllib.parse
import pandas as pd
import sqlalchemy
from server.config import ETLConfig
from server.utils.logger import get_logger
from server.utils.exceptions import ExtractionError, ConfigurationError

logger = get_logger("sdlc-etl-extractor")


class PostgreSQLExtractor:
    """Extracts records from Cloud SQL PostgreSQL database."""

    def __init__(self, config: ETLConfig):
        self.config = config

    def create_engine(self) -> sqlalchemy.engine.Engine:
        """Creates SQLAlchemy engine with Cloud SQL Connector or direct connection."""
        if self.config.database_url:
            logger.info("Using provided DATABASE_URL for extraction engine.")
            return sqlalchemy.create_engine(self.config.database_url)

        if self.config.cloud_sql_connection_name and self.config.db_user:
            try:
                from google.cloud.sql.connector import Connector, IPTypes
                logger.info(
                    "Initializing Cloud SQL Python Connector for instance %s",
                    self.config.cloud_sql_connection_name,
                )
                connector = Connector()
                is_iam = not bool(self.config.db_password)
                ip_type = IPTypes.PRIVATE if os.getenv("CLOUD_SQL_IP_TYPE", "PRIVATE").upper() == "PRIVATE" else IPTypes.PUBLIC

                def getconn():
                    return connector.connect(
                        self.config.cloud_sql_connection_name,
                        "pg8000",
                        user=self.config.db_user,
                        password=self.config.db_password if self.config.db_password else None,
                        db=self.config.db_name,
                        enable_iam_auth=is_iam,
                        ip_type=ip_type,
                    )

                return sqlalchemy.create_engine("postgresql+pg8000://", creator=getconn)
            except Exception as exc:
                raise ExtractionError(
                    f"Failed to create Cloud SQL Connector engine: {exc}"
                ) from exc

        if self.config.db_host and self.config.db_user and self.config.db_name:
            enc_pw = urllib.parse.quote_plus(self.config.db_password) if self.config.db_password else ""
            conn_str = f"postgresql://{self.config.db_user}:{enc_pw}@{self.config.db_host}:{self.config.db_port}/{self.config.db_name}"
            return sqlalchemy.create_engine(conn_str)

        raise ConfigurationError(
            "Missing required connection credentials for Cloud SQL PostgreSQL extraction."
        )

    def extract(self) -> pd.DataFrame:
        """Extracts all records from the configured source table into a DataFrame."""
        logger.info(
            "Starting extraction from table '%s' in database '%s'",
            self.config.source_table,
            self.config.db_name,
        )
        engine = self.create_engine()
        query = f"SELECT * FROM {self.config.source_table}"

        try:
            df = pd.read_sql(query, con=engine)
            logger.info("Successfully extracted %d records from %s", len(df), self.config.source_table)
            return df
        except Exception as exc:
            raise ExtractionError(
                f"Failed to execute extraction query against table '{self.config.source_table}': {exc}"
            ) from exc
        finally:
            engine.dispose()
