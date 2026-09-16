"""Sales Data Cleanser module for deterministic validation and cleansing."""
import re
import math
import logging
from datetime import datetime, date, timezone
from typing import Any

try:
    import pandas as pd
except ImportError:
    pd = None

from server.pipeline.quarantine import QuarantineManager

logger = logging.getLogger("server.pipeline.cleanser")
EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$")


class SalesDataCleanser:
    """Validates and cleans sales orders according to enterprise data quality rules."""

    def __init__(self, quarantine_manager: QuarantineManager = None):
        self.quarantine_manager = quarantine_manager or QuarantineManager()

    @staticmethod
    def is_valid_email(email: Any) -> bool:
        if not email or not isinstance(email, str):
            return False
        email_str = email.strip()
        if not email_str:
            return False
        return bool(EMAIL_REGEX.match(email_str))

    @staticmethod
    def is_valid_amount(amount: Any) -> bool:
        if amount is None:
            return False
        if pd is not None and pd.isna(amount):
            return False
        try:
            val = float(amount)
            if math.isnan(val) or math.isinf(val):
                return False
            return val > 0.0
        except (ValueError, TypeError):
            return False

    @staticmethod
    def is_valid_date(date_val: Any) -> bool:
        if date_val is None or (pd is not None and pd.isna(date_val)):
            return False
        if isinstance(date_val, (datetime, date)):
            return True
        date_str = str(date_val).strip()
        if not date_str:
            return False
        try:
            if pd is not None:
                pd.to_datetime(date_str)
            else:
                datetime.fromisoformat(date_str)
            return True
        except Exception:
            return False

    def clean_records(self, data: Any) -> Any:
        """Cleans and filters records, routing invalid rows to quarantine."""
        if data is None:
            return pd.DataFrame() if pd is not None else []

        is_df = pd is not None and isinstance(data, pd.DataFrame)
        if is_df:
            if data.empty:
                return pd.DataFrame()
            records_list = [row.to_dict() for _, row in data.iterrows()]
        elif isinstance(data, list):
            records_list = data
        else:
            records_list = list(data)

        valid_rows = []
        now_ts = datetime.now(timezone.utc)

        for record in records_list:
            order_id = record.get("order_id")
            amount = record.get("amount")
            customer_email = record.get("customer_email")
            order_date = record.get("order_date")

            # Check order_id
            if not order_id or (pd is not None and pd.isna(order_id)) or str(order_id).strip() == "":
                self.quarantine_manager.record_rejection(
                    record, "ERR_MISSING_ORDER_ID", "Missing or empty order_id"
                )
                continue

            # Check amount: non-null, > 0
            if not self.is_valid_amount(amount):
                self.quarantine_manager.record_rejection(
                    record,
                    "ERR_MISSING_OR_INVALID_AMOUNT",
                    f"Amount is null, non-numeric, or <= 0 (value: {amount})",
                )
                continue

            # Check email: RFC compliant regex
            if not self.is_valid_email(customer_email):
                self.quarantine_manager.record_rejection(
                    record,
                    "ERR_INVALID_EMAIL_FORMAT",
                    f"Invalid email format (value: {customer_email})",
                )
                continue

            # Check order_date: valid date
            if not self.is_valid_date(order_date):
                self.quarantine_manager.record_rejection(
                    record,
                    "ERR_INVALID_ORDER_DATE",
                    f"Invalid order date format (value: {order_date})",
                )
                continue

            # Clean and standardize record
            if pd is not None:
                parsed_date = pd.to_datetime(order_date).date()
            elif isinstance(order_date, (datetime, date)):
                parsed_date = order_date if isinstance(order_date, date) else order_date.date()
            else:
                parsed_date = datetime.fromisoformat(str(order_date).strip()).date()

            cleaned_row = {
                "order_id": str(order_id).strip(),
                "customer_id": (
                    str(record.get("customer_id")).strip()
                    if record.get("customer_id") and not (pd is not None and pd.isna(record.get("customer_id")))
                    else None
                ),
                "customer_name": (
                    str(record.get("customer_name")).strip()
                    if record.get("customer_name") and not (pd is not None and pd.isna(record.get("customer_name")))
                    else None
                ),
                "customer_email": str(customer_email).strip(),
                "order_date": parsed_date,
                "amount": float(amount),
                "currency": (
                    str(record.get("currency", "USD")).strip().upper()
                    if record.get("currency") and not (pd is not None and pd.isna(record.get("currency")))
                    else "USD"
                ),
                "status": (
                    str(record.get("status", "COMPLETED")).strip().upper()
                    if record.get("status") and not (pd is not None and pd.isna(record.get("status")))
                    else "COMPLETED"
                ),
                "extracted_at": record.get("extracted_at") or now_ts,
                "loaded_at": now_ts,
            }
            valid_rows.append(cleaned_row)

        if is_df:
            return pd.DataFrame(valid_rows)
        return valid_rows
