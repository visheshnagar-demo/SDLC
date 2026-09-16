"""PostgreSQL data extractor module."""
import logging
import time
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from sqlalchemy import text
from sqlalchemy.engine import Engine
from server.database import get_engine

logger = logging.getLogger(__name__)


class PostgresExtractor:
    """Extracts raw sales order records from PostgreSQL raw_sales_orders table."""

    def __init__(self, db_url: Optional[str] = None, engine: Optional[Engine] = None, max_retries: int = 3, retry_delay: float = 2.0):
        self.engine = engine or get_engine(db_url)
        self.max_retries = max_retries
        self.retry_delay = retry_delay

    def extract(self, table_name: str = "raw_sales_orders", batch_size: Optional[int] = None, filter_query: Optional[str] = None) -> List[Dict[str, Any]]:
        """Extract records from source PostgreSQL table with retry mechanism."""
        query_str = filter_query or f"SELECT order_id, customer_id, customer_name, customer_email, order_date, amount, currency, status, created_at FROM {table_name}"
        if batch_size:
            query_str += f" LIMIT {int(batch_size)}"

        attempt = 0
        last_error = None
        while attempt < self.max_retries:
            attempt += 1
            try:
                logger.info(f"Extracting sales orders from table '{table_name}' (attempt {attempt}/{self.max_retries})...")
                extracted_records: List[Dict[str, Any]] = []
                extracted_at = datetime.now(timezone.utc)

                with self.engine.connect() as connection:
                    result = connection.execute(text(query_str))
                    columns = result.keys()
                    for row in result:
                        row_dict = dict(zip(columns, row))
                        row_dict["_extracted_at"] = extracted_at
                        extracted_records.append(row_dict)

                logger.info(f"Successfully extracted {len(extracted_records)} records from '{table_name}'.")
                return extracted_records
            except Exception as exc:
                last_error = exc
                logger.warning(f"Extraction attempt {attempt} failed: {exc}")
                if attempt < self.max_retries:
                    time.sleep(self.retry_delay * (2 ** (attempt - 1)))

        logger.error(f"Failed to extract from '{table_name}' after {self.max_retries} attempts.")
        raise RuntimeError(f"Database extraction failed after {self.max_retries} retries: {last_error}") from last_error
