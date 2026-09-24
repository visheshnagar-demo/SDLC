"""Data extraction module for Cloud SQL PostgreSQL."""
import pandas as pd
from config import config
from pipeline.db_connector import CloudSQLPostgresConnector
from pipeline.observability import logger, log_structured_metric


class PostgresExtractor:
    """Extracts raw records from PostgreSQL table."""

    def __init__(self, connector: CloudSQLPostgresConnector = None):
        self.connector = connector or CloudSQLPostgresConnector()

    def extract(self) -> pd.DataFrame:
        """Extracts all rows from source table test_data."""
        logger.info("Initiating extraction from PostgreSQL table: %s", config.source_table)
        engine = self.connector.get_engine()
        query = f"SELECT * FROM {config.source_table}"

        try:
            df = pd.read_sql(query, con=engine)
        finally:
            self.connector.close()

        row_count = len(df)
        logger.info("Extraction completed successfully. Extracted %d records.", row_count)
        log_structured_metric(
            "extraction_complete",
            {
                "source_table": config.source_table,
                "rows_extracted": row_count,
            },
        )
        return df
