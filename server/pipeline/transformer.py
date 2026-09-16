import datetime
from typing import Any, Dict, List, Optional


def transform_record(record: Dict[str, Any]) -> Dict[str, Any]:
    """
    Transforms a single validated raw sales record into BigQuery target format.
    """
    order_id = str(record.get("order_id", "")).strip()

    customer_id = record.get("customer_id")
    if customer_id is not None:
        customer_id = str(customer_id).strip()
        if not customer_id:
            customer_id = None

    customer_email = str(record.get("customer_email", "")).strip()

    order_date = record.get("order_date")
    if isinstance(order_date, (datetime.date, datetime.datetime)):
        order_date_str = order_date.strftime("%Y-%m-%d")
    elif isinstance(order_date, str):
        # Extract YYYY-MM-DD
        order_date_str = order_date[:10]
    else:
        order_date_str = datetime.date.today().isoformat()

    amount_val = float(record.get("amount", 0.0))
    amount = round(amount_val, 2)

    currency = record.get("currency")
    if currency:
        currency = str(currency).strip().upper()
    else:
        currency = "USD"

    status = record.get("status")
    if status:
        status = str(status).strip().lower()
    else:
        status = "completed"

    created_at = record.get("created_at") or record.get("source_created_at")
    if isinstance(created_at, (datetime.date, datetime.datetime)):
        source_created_at = created_at.isoformat()
    elif isinstance(created_at, str):
        source_created_at = created_at
    else:
        source_created_at = None

    ingested_at = datetime.datetime.now(datetime.timezone.utc).isoformat()

    return {
        "order_id": order_id,
        "customer_id": customer_id,
        "customer_email": customer_email,
        "order_date": order_date_str,
        "amount": amount,
        "currency": currency,
        "status": status,
        "source_created_at": source_created_at,
        "ingested_at": ingested_at,
    }


def transform_sales_records(records: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Transforms a list of validated sales records.
    """
    return [transform_record(rec) for rec in records]
