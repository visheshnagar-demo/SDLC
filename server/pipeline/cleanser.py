"""Data cleansing and validation module for sales orders."""
import logging
import math
import re
from datetime import date, datetime, timezone
from decimal import Decimal
from typing import Any, Dict, List, Optional, Tuple
from server.models import QuarantineRecord, SalesOrderClean

logger = logging.getLogger(__name__)

EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$")


class SalesDataCleanser:
    """Validates and cleans extracted sales orders, separating valid records from quarantined ones."""

    def __init__(self):
        self.email_pattern = EMAIL_REGEX

    def validate_record(self, raw_record: Dict[str, Any]) -> Tuple[Optional[SalesOrderClean], Optional[QuarantineRecord]]:
        """Validate an individual record against all business rules."""
        order_id = raw_record.get("order_id")
        if not order_id or not str(order_id).strip():
            return None, QuarantineRecord(
                order_id=None,
                error_code="ERR_MISSING_ORDER_ID",
                rejection_reason="Missing or empty order_id",
                raw_record=raw_record,
            )
        order_id_str = str(order_id).strip()

        # Validate Amount
        raw_amount = raw_record.get("amount")
        if raw_amount is None:
            return None, QuarantineRecord(
                order_id=order_id_str,
                error_code="ERR_MISSING_OR_INVALID_AMOUNT",
                rejection_reason="Amount is NULL or missing",
                raw_record=raw_record,
            )

        try:
            if isinstance(raw_amount, str) and not raw_amount.strip():
                raise ValueError("Empty string amount")
            amount_val = float(raw_amount)
            if math.isnan(amount_val) or math.isinf(amount_val) or amount_val <= 0:
                return None, QuarantineRecord(
                    order_id=order_id_str,
                    error_code="ERR_MISSING_OR_INVALID_AMOUNT",
                    rejection_reason=f"Amount must be a positive number greater than zero; got {raw_amount}",
                    raw_record=raw_record,
                )
        except (ValueError, TypeError):
            return None, QuarantineRecord(
                order_id=order_id_str,
                error_code="ERR_MISSING_OR_INVALID_AMOUNT",
                rejection_reason=f"Amount cannot be parsed as a numeric value: {raw_amount}",
                raw_record=raw_record,
            )

        # Validate Email
        raw_email = raw_record.get("customer_email")
        if not raw_email or not isinstance(raw_email, str) or not str(raw_email).strip():
            return None, QuarantineRecord(
                order_id=order_id_str,
                error_code="ERR_INVALID_EMAIL_FORMAT",
                rejection_reason="Customer email is missing or empty",
                raw_record=raw_record,
            )
        email_clean = str(raw_email).strip()
        if not self.email_pattern.match(email_clean):
            return None, QuarantineRecord(
                order_id=order_id_str,
                error_code="ERR_INVALID_EMAIL_FORMAT",
                rejection_reason=f"Customer email '{email_clean}' does not match standard RFC email pattern",
                raw_record=raw_record,
            )

        # Validate Order Date
        raw_date = raw_record.get("order_date")
        parsed_date: Optional[date] = None
        if isinstance(raw_date, date) and not isinstance(raw_date, datetime):
            parsed_date = raw_date
        elif isinstance(raw_date, datetime):
            parsed_date = raw_date.date()
        elif isinstance(raw_date, str):
            try:
                parsed_date = datetime.strptime(raw_date.strip()[:10], "%Y-%m-%d").date()
            except (ValueError, TypeError):
                parsed_date = None

        if not parsed_date:
            return None, QuarantineRecord(
                order_id=order_id_str,
                error_code="ERR_INVALID_ORDER_DATE",
                rejection_reason=f"Order date '{raw_date}' is missing or not a valid ISO date (YYYY-MM-DD)",
                raw_record=raw_record,
            )

        extracted_at = raw_record.get("_extracted_at") or datetime.now(timezone.utc)
        if isinstance(extracted_at, str):
            try:
                extracted_at = datetime.fromisoformat(extracted_at)
            except Exception:
                extracted_at = datetime.now(timezone.utc)

        loaded_at = datetime.now(timezone.utc)

        customer_id = str(raw_record.get("customer_id")).strip() if raw_record.get("customer_id") is not None else None
        customer_name = str(raw_record.get("customer_name")).strip() if raw_record.get("customer_name") is not None else None
        currency = str(raw_record.get("currency") or "USD").strip().upper()
        status = str(raw_record.get("status") or "PENDING").strip().upper()

        clean_record = SalesOrderClean(
            order_id=order_id_str,
            customer_id=customer_id,
            customer_name=customer_name,
            customer_email=email_clean,
            order_date=parsed_date,
            amount=round(amount_val, 2),
            currency=currency,
            status=status,
            extracted_at=extracted_at,
            loaded_at=loaded_at,
        )

        return clean_record, None

    def process_batch(self, raw_records: List[Dict[str, Any]]) -> Tuple[List[SalesOrderClean], List[QuarantineRecord]]:
        """Process a batch of records, separating valid from quarantined records."""
        clean_records: List[SalesOrderClean] = []
        quarantine_records: List[QuarantineRecord] = []

        for record in raw_records:
            clean, quarantine = self.validate_record(record)
            if clean:
                clean_records.append(clean)
            elif quarantine:
                quarantine_records.append(quarantine)

        logger.info(f"Cleansing completed. Total: {len(raw_records)}, Valid: {len(clean_records)}, Quarantined: {len(quarantine_records)}")
        return clean_records, quarantine_records
