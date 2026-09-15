"""PostgreSQL data extractor for raw_sales_orders."""
import logging
from datetime import date
from typing import Any, Dict, Generator, List, Optional
from sqlalchemy import select
from sqlalchemy.orm import Session
from server.models import RawSalesOrder

logger = logging.getLogger("pg_extractor")


class PostgreSQLExtractor:
    """Extracts raw sales orders from PostgreSQL."""

    def __init__(self, db: Session):
        self.db = db

    def extract_orders(
        self,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        batch_size: int = 5000,
        offset: int = 0,
    ) -> List[Dict[str, Any]]:
        """Extracts a batch of sales orders from raw_sales_orders table."""
        stmt = select(RawSalesOrder)
        if start_date:
            stmt = stmt.where(RawSalesOrder.order_date >= start_date)
        if end_date:
            stmt = stmt.where(RawSalesOrder.order_date <= end_date)

        stmt = stmt.order_date = stmt.order_by(RawSalesOrder.order_date.asc(), RawSalesOrder.order_id.asc())
        stmt = stmt.offset(offset).limit(batch_size)

        results = self.db.execute(stmt).scalars().all()
        logger.info("Extracted %d records from raw_sales_orders (offset=%d, limit=%d)", len(results), offset, batch_size)

        records = []
        for row in results:
            records.append({
                "order_id": row.order_id,
                "customer_email": row.customer_email,
                "amount": float(row.amount) if row.amount is not None else None,
                "order_date": row.order_date,
                "created_at": row.created_at,
                "updated_at": row.updated_at,
            })
        return records

    def stream_all_batches(
        self,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        batch_size: int = 5000,
    ) -> Generator[List[Dict[str, Any]], None, None]:
        """Generator to stream all batches to maintain low memory footprint."""
        offset = 0
        while True:
            batch = self.extract_orders(
                start_date=start_date,
                end_date=end_date,
                batch_size=batch_size,
                offset=offset,
            )
            if not batch:
                break
            yield batch
            offset += len(batch)
            if len(batch) < batch_size:
                break
