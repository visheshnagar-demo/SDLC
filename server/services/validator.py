import re
import logging
from typing import List, Tuple, Dict, Any, Optional
from datetime import datetime
from server.models import RawSalesOrder
from server.schemas import CleanSalesOrderSchema

logger = logging.getLogger(__name__)

# Standard RFC 5322 compatible regex pattern for email validation (requiring valid domain labels)
EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+$")


class DataValidationEngine:
    """
    Data quality and validation engine for sales order records.
    Applies business rules:
      1. amount is not NULL / missing and is a valid non-negative numeric value.
      2. customer_email is trimmed and conforms to valid RFC email syntax.
    """

    @staticmethod
    def is_valid_email(email: Optional[str]) -> bool:
        if not email or not isinstance(email, str):
            return False
        trimmed = email.strip()
        if not trimmed:
            return False
        if ".." in trimmed or " " in trimmed:
            return False
        return bool(EMAIL_REGEX.match(trimmed))

    @staticmethod
    def is_valid_amount(amount: Any) -> bool:
        if amount is None:
            return False
        try:
            val = float(amount)
            # Allow 0 or positive amounts (reject NaN / Inf)
            if val < 0 or val != val or val == float("inf") or val == float("-inf"):
                return False
            return True
        except (ValueError, TypeError):
            return False

    def validate_record(
        self, record: RawSalesOrder
    ) -> Tuple[bool, Optional[str], Optional[CleanSalesOrderSchema]]:
        """
        Validates a single RawSalesOrder record.
        Returns:
            (is_valid, drop_reason, cleaned_order_schema)
        """
        # 1. Amount validation
        if not self.is_valid_amount(record.amount):
            return False, "MISSING_OR_INVALID_AMOUNT", None

        # 2. Email validation
        if not self.is_valid_email(record.customer_email):
            return False, "INVALID_EMAIL_FORMAT", None

        # Convert to cleaned schema
        cleaned_order = CleanSalesOrderSchema(
            order_id=str(record.order_id),
            customer_id=str(record.customer_id) if record.customer_id else None,
            customer_email=str(record.customer_email).strip(),
            order_date=record.order_date,
            amount=float(record.amount),
            currency=str(record.currency) if record.currency else "USD",
            status=str(record.status) if record.status else "COMPLETED",
            ingested_at=datetime.utcnow(),
        )

        return True, None, cleaned_order

    def process_batch(
        self, records: List[RawSalesOrder]
    ) -> Tuple[List[CleanSalesOrderSchema], List[Dict[str, Any]], Dict[str, int]]:
        """
        Validates a batch of raw records.
        Returns:
            - List of valid CleanSalesOrderSchema
            - List of quarantined records (order_id, reason, raw_dict)
            - Breakdown statistics: {"missing_amount": count, "invalid_email": count}
        """
        valid_records: List[CleanSalesOrderSchema] = []
        quarantined: List[Dict[str, Any]] = []
        breakdown = {"missing_amount": 0, "invalid_email": 0}

        for record in records:
            is_valid, reason, clean_order = self.validate_record(record)
            if is_valid and clean_order:
                valid_records.append(clean_order)
            else:
                if reason == "MISSING_OR_INVALID_AMOUNT":
                    breakdown["missing_amount"] += 1
                elif reason == "INVALID_EMAIL_FORMAT":
                    breakdown["invalid_email"] += 1

                raw_dict = {
                    "order_id": getattr(record, "order_id", None),
                    "customer_id": getattr(record, "customer_id", None),
                    "customer_email": getattr(record, "customer_email", None),
                    "order_date": str(getattr(record, "order_date", None)),
                    "amount": float(record.amount)
                    if record.amount is not None
                    else None,
                    "currency": getattr(record, "currency", None),
                    "status": getattr(record, "status", None),
                }
                quarantined.append(
                    {
                        "order_id": getattr(record, "order_id", None),
                        "reason": reason or "UNKNOWN",
                        "raw_data": raw_dict,
                    }
                )

        return valid_records, quarantined, breakdown
