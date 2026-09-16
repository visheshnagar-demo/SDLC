import datetime
import logging
import time
from typing import Any, Dict, List, Optional
from sqlalchemy import select
from sqlalchemy.orm import Session
from server.models import RawSalesOrder

logger = logging.getLogger("etl_extractor")


def extract_raw_sales_orders(
    db: Session,
    start_date: Optional[datetime.date] = None,
    end_date: Optional[datetime.date] = None,
    batch_size: int = 1000,
    max_retries: int = 3,
) -> List[Dict[str, Any]]:
    """
    Extracts sales order records from raw_sales_orders table with retry support.
    """
    attempts = 0
    while attempts < max_retries:
        try:
            query = select(RawSalesOrder)
            if start_date:
                query = query.where(RawSalesOrder.order_date >= start_date)
            if end_date:
                query = query.where(RawSalesOrder.order_date <= end_date)
            query = query.limit(batch_size)

            results = db.execute(query).scalars().all()

            records = []
            for item in results:
                records.append({
                    "order_id": str(item.order_id),
                    "customer_id": str(item.customer_id) if item.customer_id else None,
                    "customer_email": str(item.customer_email) if item.customer_email else None,
                    "order_date": item.order_date,
                    "amount": float(item.amount) if item.amount is not None else None,
                    "currency": str(item.currency) if item.currency else "USD",
                    "status": str(item.status) if item.status else "completed",
                    "created_at": item.created_at,
                })

            logger.info(f"Extracted {len(records)} records from raw_sales_orders.")
            return records
        except Exception as exc:
            attempts += 1
            logger.warning(f"Extraction attempt {attempts} failed: {exc}")
            if attempts >= max_retries:
                logger.error("Max retries exceeded during extraction.")
                raise exc
            time.sleep(0.5 * (2 ** attempts))

    return []
