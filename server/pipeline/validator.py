import math
import re
from typing import Any, Dict, List, Optional, Tuple

EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+$")


def validate_email(email: Optional[str]) -> bool:
    """Validate email against standard RFC format."""
    if email is None or not isinstance(email, str):
        return False
    email = email.strip()
    if not email:
        return False
    if ".." in email or email.endswith(".") or email.startswith("."):
        return False
    return bool(EMAIL_REGEX.match(email))


def validate_amount(amount: Any) -> bool:
    """Validate that amount is a non-null, positive finite numeric value (> 0)."""
    if amount is None:
        return False
    try:
        val = float(amount)
        if math.isnan(val) or math.isinf(val):
            return False
        return val > 0.0
    except (ValueError, TypeError):
        return False


def validate_record(record: Dict[str, Any]) -> Tuple[bool, Optional[str]]:
    """
    Validate an individual sales order record.
    Returns (is_valid, error_reason).
    """
    amount = record.get("amount")
    if not validate_amount(amount):
        return False, "MISSING_OR_NULL_AMOUNT"

    email = record.get("customer_email")
    if not validate_email(email):
        return False, "INVALID_EMAIL_FORMAT"

    return True, None


def validate_sales_records(
    records: List[Dict[str, Any]],
) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]], Dict[str, int]]:
    """
    Validate batch of raw sales records.
    Filters out invalid amounts and invalid emails.
    Returns (valid_records, filtered_records, metrics).
    """
    valid_records: List[Dict[str, Any]] = []
    filtered_records: List[Dict[str, Any]] = []

    filtered_missing_amount = 0
    filtered_invalid_email = 0

    for rec in records:
        # Convert object to dict if needed
        data = rec if isinstance(rec, dict) else rec.__dict__
        is_valid, reason = validate_record(data)

        if is_valid:
            valid_records.append(data)
        else:
            rejected_item = dict(data)
            rejected_item["rejection_reason"] = reason
            filtered_records.append(rejected_item)

            if reason == "MISSING_OR_NULL_AMOUNT":
                filtered_missing_amount += 1
            elif reason == "INVALID_EMAIL_FORMAT":
                filtered_invalid_email += 1

    total_filtered = filtered_missing_amount + filtered_invalid_email
    metrics = {
        "extracted_count": len(records),
        "filtered_missing_amount": filtered_missing_amount,
        "filtered_invalid_email": filtered_invalid_email,
        "total_filtered": total_filtered,
        "loaded_count": len(valid_records),
    }

    return valid_records, filtered_records, metrics
