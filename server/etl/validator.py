"""Data cleansing and validation module for sales orders."""
import logging
import re
from typing import Any, Dict, List, Optional, Tuple

logger = logging.getLogger("server.etl.validator")

# RFC 5322 compliant regex pattern for email address syntax
EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$")


class ValidationResult:
    """Encapsulates validation output for a batch of records."""

    def __init__(self):
        self.valid_records: List[Dict[str, Any]] = []
        self.quarantined_records: List[Dict[str, Any]] = []
        self.filtered_missing_amount_count: int = 0
        self.filtered_invalid_email_count: int = 0


class DataValidator:
    """Validates raw sales order records according to business and RFC standards."""

    @staticmethod
    def is_valid_email(email: Optional[str]) -> bool:
        """Validates RFC 5322 email syntax."""
        if not email or not isinstance(email, str):
            return False
        clean_email = email.strip()
        if not clean_email:
            return False
        return bool(EMAIL_REGEX.match(clean_email))

    @staticmethod
    def is_valid_amount(amount: Any) -> bool:
        """Validates that amount is present, non-null, and strictly positive (> 0)."""
        if amount is None or amount == "":
            return False
        try:
            num = float(amount)
            return num > 0
        except (ValueError, TypeError):
            return False

    def validate_record(self, record: Dict[str, Any]) -> Tuple[bool, Optional[str]]:
        """Evaluates a single record. Returns (is_valid, rejection_reason)."""
        order_id = record.get("order_id")

        # Criterion 1: Missing / Non-positive Amount
        if not self.is_valid_amount(record.get("amount")):
            logger.warning("Order %s rejected: missing, non-numeric, or non-positive amount (%s).", order_id, record.get("amount"))
            return False, "MISSING_AMOUNT"

        # Criterion 2: Missing / Invalid Customer Email
        if not self.is_valid_email(record.get("customer_email")):
            logger.warning("Order %s rejected: invalid or missing customer email (%s).", order_id, record.get("customer_email"))
            return False, "INVALID_EMAIL"

        return True, None

    def validate_batch(self, records: List[Dict[str, Any]]) -> ValidationResult:
        """Processes a list of raw records, partitioning into valid and quarantined collections."""
        result = ValidationResult()

        for record in records:
            is_valid, reason = self.validate_record(record)
            if is_valid:
                result.valid_records.append(record)
            else:
                quarantine_entry = dict(record)
                quarantine_entry["rejection_reason"] = reason
                result.quarantined_records.append(quarantine_entry)

                if reason == "MISSING_AMOUNT":
                    result.filtered_missing_amount_count += 1
                elif reason == "INVALID_EMAIL":
                    result.filtered_invalid_email_count += 1

        logger.info(
            "Validation finished: %d valid, %d filtered (missing amount: %d, invalid email: %d)",
            len(result.valid_records),
            len(result.quarantined_records),
            result.filtered_missing_amount_count,
            result.filtered_invalid_email_count,
        )
        return result
