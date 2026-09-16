import time
from datetime import date
from typing import Any, Dict, Generator, List, Optional
from sqlalchemy import select
from sqlalchemy.orm import Session
from server.database import SessionLocal, engine
from server.models import RawSalesOrder
from server.pipeline.logger import pipeline_logger


class PostgresExtractor:
    """
    Extracts raw sales orders from PostgreSQL table raw_sales_orders.
    """

    def __init__(self, db_session: Optional[Session] = None, max_retries: int = 3, retry_delay: float = 1.0):
        self.db_session = db_session
        self.max_retries = max_retries
        self.retry_delay = retry_delay

    def extract_records(
        self,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        batch_size: int = 1000
    ) -> List[Dict[str, Any]]:
        """
        Extracts sales orders matching date criteria with automatic retry logic.
        """
        attempt = 0
        last_error = None

        while attempt < self.max_retries:
            attempt += 1
            session = self.db_session or SessionLocal()
            try:
                query = select(RawSalesOrder)
                if start_date:
                    query = query.where(RawSalesOrder.order_date >= start_date)
                if end_date:
                    query = query.where(RawSalesOrder.order_date <= end_date)
                
                query = query.order_by(RawSalesOrder.order_date.asc())

                results = session.execute(query).scalars().all()
                records = [
                    {
                        "order_id": r.order_id,
                        "customer_id": r.customer_id,
                        "customer_email": r.customer_email,
                        "order_date": r.order_date,
                        "amount": float(r.amount) if r.amount is not None else None,
                        "currency": r.currency,
                        "status": r.status,
                        "created_at": r.created_at
                    }
                    for r in results
                ]
                pipeline_logger.info(f"Extractor: Successfully fetched {len(records)} records from raw_sales_orders")
                return records
            except Exception as exc:
                last_error = exc
                pipeline_logger.warning(
                    f"Extractor: Error extracting records on attempt {attempt}/{self.max_retries}: {exc}"
                )
                time.sleep(self.retry_delay * (2 ** (attempt - 1)))
            finally:
                if not self.db_session:
                    session.close()

        pipeline_logger.error(f"Extractor: Failed to extract records after {self.max_retries} attempts")
        raise RuntimeError(f"PostgreSQL extraction failed: {last_error}")

    def check_connection(self) -> bool:
        """
        Verifies database connectivity.
        """
        session = self.db_session or SessionLocal()
        try:
            session.execute(select(1))
            return True
        except Exception as exc:
            pipeline_logger.error(f"Extractor health check failed: {exc}")
            return False
        finally:
            if not self.db_session:
                session.close()
