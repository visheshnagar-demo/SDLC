import re
from decimal import Decimal
from typing import Any, Dict, List, Tuple
from server.pipeline.logger import pipeline_logger

# RFC 5322 compliant regex for standard email addresses
EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$")


class DataValidator:
    """
    Validates and cleanses raw sales order records.
    Filters out records with missing/non-positive amounts and invalid email formats.
    """

    @staticmethod
    def is_valid_email(email: Any) -> bool:
        if not email or not isinstance(email, str):
            return False
        cleaned = email.strip()
        return bool(EMAIL_REGEX.match(cleaned))

    @staticmethod
    def is_valid_amount(amount: Any) -> bool:
        if amount is None:
            return False
        try:
            val = float(amount)
            return val > 0.0
        except (ValueError, TypeError):
            return False

    @classmethod
    def validate_record(cls, record: Dict[str, Any]) -> Tuple[bool, str]:
        """
        Validates a single sales record dictionary.
        Returns (is_valid, rejection_reason).
        """
        amount = record.get("amount")
        if not cls.is_valid_amount(amount):
            return False, "MISSING_OR_NULL_AMOUNT"

        email = record.get("customer_email")
        if not cls.is_valid_email(email):
            return False, "INVALID_EMAIL_FORMAT"

        return True, ""

    @classmethod
    def validate_batch(cls, records: List[Dict[str, Any]]) -> Tuple[List[Dict[str, Any]], Dict[str, int], List[Dict[str, Any]]]:
        """
        Validates a list of sales order records.
        Returns:
            valid_records: List of cleansed records
            metrics: Dict with count statistics
            quarantined_records: List of rejected records with reason
        """
        valid_records: List[Dict[str, Any]] = []
        quarantined_records: List[Dict[str, Any]] = []
        
        filtered_missing_amount = 0
        filtered_invalid_email = 0

        for r in records:
            is_valid, reason = cls.validate_record(r)
            if is_valid:
                valid_records.append(r)
            else:
                if reason == "MISSING_OR_NULL_AMOUNT":
                    filtered_missing_amount += 1
                    pipeline_logger.warning(
                        f"Validator: Dropped record order_id={r.get('order_id')} (Missing or non-positive amount: {r.get('amount')})"
                    )
                elif reason == "INVALID_EMAIL_FORMAT":
                    filtered_invalid_email += 1
                    pipeline_logger.warning(
                        f"Validator: Dropped record order_id={r.get('order_id')} (Invalid email: '{r.get('customer_email')}')"
                    )
                
                quarantined_record = dict(r)
                quarantined_record["rejection_reason"] = reason
                quarantined_records.append(quarantined_record)

        total_filtered = filtered_missing_amount + filtered_invalid_email
        metrics = {
            "extracted_count": len(records),
            "filtered_missing_amount": filtered_missing_amount,
            "filtered_invalid_email": filtered_invalid_email,
            "total_filtered": total_filtered,
            "valid_count": len(valid_records)
        }

        return valid_records, metrics, quarantined_records
