"""PostgreSQL data extractor module."""
import logging
from typing import Any, Dict, Generator, List, Optional
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session, sessionmaker

from server.config import settings

logger = logging.getLogger("server.etl.extractor")


class PostgreSQLExtractor:
    """Extracts raw sales orders from PostgreSQL table raw_sales_orders."""

    def __init__(
        self,
        db_url: Optional[str] = None,
        table_name: Optional[str] = None,
        batch_size: Optional[int] = None,
        session: Optional[Session] = None,
    ):
        self.db_url = db_url or settings.DATABASE_URL
        self.table_name = table_name or settings.SOURCE_TABLE_NAME
        self.batch_size = batch_size or settings.BATCH_SIZE
        self._session = session
        self._engine = None

    def _get_session(self) -> Session:
        """Obtains an active database session."""
        if self._session is not None:
            return self._session

        if not self.db_url:
            raise EnvironmentError(
                "PostgreSQL connection URL is not configured. Set DATABASE_URL or POSTGRES_* environment variables."
            )

        if self._engine is None:
            self._engine = create_engine(self.db_url, pool_pre_ping=True)

        session_factory = sessionmaker(bind=self._engine)
        return session_factory()

    def extract_all(self) -> List[Dict[str, Any]]:
        """Extracts all raw sales orders from PostgreSQL table."""
        logger.info("Extracting records from table '%s'...", self.table_name)
        session = self._get_session()
        try:
            query = text(f"SELECT order_id, customer_email, amount, order_date, created_at FROM {self.table_name}")
            result = session.execute(query)
            rows = result.mappings().all()

            records = []
            for row in rows:
                record = {
                    "order_id": str(row["order_id"]) if row.get("order_id") is not None else None,
                    "customer_email": str(row["customer_email"]) if row.get("customer_email") is not None else None,
                    "amount": float(row["amount"]) if row.get("amount") is not None else None,
                    "order_date": row.get("order_date"),
                    "created_at": row.get("created_at"),
                }
                records.append(record)

            logger.info("Successfully extracted %d records from %s.", len(records), self.table_name)
            return records
        except Exception as exc:
            logger.error("Failed to extract records from PostgreSQL table %s: %s", self.table_name, exc)
            raise RuntimeError(f"Database extraction error: {exc}") from exc
        finally:
            if self._session is None and session:
                session.close()

    def extract_batches(self) -> Generator[List[Dict[str, Any]], None, None]:
        """Yields records in chunks for memory-efficient processing."""
        records = self.extract_all()
        for i in range(0, len(records), self.batch_size):
            yield records[i : i + self.batch_size]
