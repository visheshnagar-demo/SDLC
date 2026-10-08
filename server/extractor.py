"""Extractor module for pulling raw records from PostgreSQL test_data table."""
import logging
from typing import List, Dict, Any, Optional
import sqlalchemy
from sqlalchemy.exc import SQLAlchemyError
import pandas as pd
from server.database import get_db_engine

logger = logging.getLogger(__name__)


class PostgresExtractor:
    def __init__(self, table_name: str = "test_data"):
        self.table_name = table_name

    def extract_records(self, limit: Optional[int] = None) -> List[Dict[str, Any]]:
        """Extracts records from the source PostgreSQL table.
        
        Zero-mock: Connects to real database and raises error on failure.
        """
        engine, connector = get_db_engine()
        try:
            query = f"SELECT * FROM {self.table_name}"
            if limit:
                query += f" LIMIT {int(limit)}"
            
            logger.info("Executing query: %s", query)
            df = pd.read_sql(query, con=engine)
            records = df.to_dict(orient="records")
            logger.info("Successfully extracted %d records from %s", len(records), self.table_name)
            return records
        finally:
            if engine is not None:
                engine.dispose()
            if connector is not None:
                connector.close()

    def check_connection(self) -> bool:
        """Checks source database connectivity."""
        try:
            engine, connector = get_db_engine()
            try:
                with engine.connect() as conn:
                    conn.execute(sqlalchemy.text("SELECT 1"))
                return True
            finally:
                if engine is not None:
                    engine.dispose()
                if connector is not None:
                    connector.close()
        except (SQLAlchemyError, RuntimeError, EnvironmentError) as e:
            logger.warning("Database connection check failed: %s", e)
            return False
