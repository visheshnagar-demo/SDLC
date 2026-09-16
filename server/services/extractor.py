import logging
from typing import List, Optional, Generator
from datetime import date
from sqlalchemy.orm import Session
from server.models import RawSalesOrder

logger = logging.getLogger(__name__)


class PostgresExtractor:
    """
    Extracts raw sales orders from PostgreSQL raw_sales_orders table.
    Supports date filtering and batch/chunked streaming.
    """

    def __init__(self, db: Session):
        self.db = db

    def extract_orders(
        self,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        limit: Optional[int] = None,
        offset: int = 0,
    ) -> List[RawSalesOrder]:
        """
        Extracts raw sales orders within an optional date range.
        """
        query = self.db.query(RawSalesOrder)

        if start_date is not None:
            query = query.filter(RawSalesOrder.order_date >= start_date)
        if end_date is not None:
            query = query.filter(RawSalesOrder.order_date <= end_date)

        query = (
            query.order_date_ascending()
            if hasattr(query, "order_date_ascending")
            else query.order_by(
                RawSalesOrder.order_date.asc(), RawSalesOrder.order_id.asc()
            )
        )

        if offset > 0:
            query = query.offset(offset)
        if limit is not None:
            query = query.limit(limit)

        results = query.all()
        logger.info(
            f"Extracted {len(results)} raw sales orders (start_date={start_date}, end_date={end_date}, offset={offset}, limit={limit})"
        )
        return results

    def extract_batches(
        self,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        batch_size: int = 1000,
    ) -> Generator[List[RawSalesOrder], None, None]:
        """
        Generator to stream raw sales orders in chunks/batches.
        """
        offset = 0
        while True:
            batch = self.extract_orders(
                start_date=start_date,
                end_date=end_date,
                limit=batch_size,
                offset=offset,
            )
            if not batch:
                break
            yield batch
            offset += len(batch)
            if len(batch) < batch_size:
                break
