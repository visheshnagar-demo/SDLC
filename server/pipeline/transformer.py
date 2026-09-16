from datetime import datetime, date, timezone
from decimal import Decimal
from typing import Any, Dict, List


class DataTransformer:
    """
    Transforms validated sales records into the target BigQuery format.
    """

    @staticmethod
    def transform_record(record: Dict[str, Any]) -> Dict[str, Any]:
        """
        Transforms a single validated sales order dict.
        """
        order_id = str(record.get("order_id", "")).strip()
        
        customer_id = record.get("customer_id")
        if customer_id is not None:
            customer_id = str(customer_id).strip()
            if not customer_id:
                customer_id = None

        customer_email = str(record.get("customer_email", "")).strip()

        order_date_raw = record.get("order_date")
        if isinstance(order_date_raw, str):
            order_date_val = datetime.strptime(order_date_raw[:10], "%Y-%m-%d").date()
        elif isinstance(order_date_raw, datetime):
            order_date_val = order_date_raw.date()
        elif isinstance(order_date_raw, date):
            order_date_val = order_date_raw
        else:
            order_date_val = datetime.now(timezone.utc).date()

        amount_raw = record.get("amount")
        amount_val = float(Decimal(str(amount_raw)))

        currency = record.get("currency")
        currency_val = str(currency).strip().upper() if currency else "USD"

        status = record.get("status")
        status_val = str(status).strip().lower() if status else "pending"

        created_at_raw = record.get("created_at")
        if created_at_raw:
            if isinstance(created_at_raw, datetime):
                source_created_at = created_at_raw.isoformat()
            else:
                source_created_at = str(created_at_raw)
        else:
            source_created_at = None

        ingested_at_val = datetime.now(timezone.utc).isoformat()

        return {
            "order_id": order_id,
            "customer_id": customer_id,
            "customer_email": customer_email,
            "order_date": order_date_val.strftime("%Y-%m-%d"),
            "amount": amount_val,
            "currency": currency_val,
            "status": status_val,
            "source_created_at": source_created_at,
            "ingested_at": ingested_at_val
        }

    @classmethod
    def transform_batch(cls, records: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Transforms a batch of validated sales records.
        """
        return [cls.transform_record(r) for r in records]
