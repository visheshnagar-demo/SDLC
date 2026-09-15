"""Sales order transformation and cleansing service."""
import re
from datetime import date, datetime, timezone
from typing import Any, Dict, List, Optional, Tuple

EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$")


class SalesTransformer:
    """Transforms and cleans raw sales order records."""

    @staticmethod
    def validate_and_transform_record(
        raw_record: Dict[str, Any], job_id: str, load_timestamp: Optional[datetime] = None
    ) -> Tuple[Optional[Dict[str, Any]], List[str]]:
        """
        Validates and cleanses a single sales order record.
        
        Returns:
            Tuple of (cleaned_record_dict_or_None, list_of_rejection_reasons)
        """
        rejection_reasons = []
        load_timestamp = load_timestamp or datetime.now(timezone.utc)

        # 1. Order ID validation
        order_id = raw_record.get("order_id")
        if not order_id or not str(order_id).strip():
            rejection_reasons.append("MISSING_ORDER_ID")
            order_id = str(order_id) if order_id else ""
        else:
            order_id = str(order_id).strip()

        # 2. Amount validation: must be present, numeric, and > 0
        raw_amount = raw_record.get("amount")
        amount_val = None
        if raw_amount is None or raw_amount == "":
            rejection_reasons.append("MISSING_OR_NULL_AMOUNT")
        else:
            try:
                amount_val = float(raw_amount)
                if amount_val <= 0:
                    rejection_reasons.append("NON_POSITIVE_AMOUNT")
                else:
                    amount_val = round(amount_val, 2)
            except (ValueError, TypeError):
                rejection_reasons.append("INVALID_AMOUNT_FORMAT")

        # 3. Customer Email validation: RFC 5322 regex
        raw_email = raw_record.get("customer_email")
        cleaned_email = None
        if not raw_email or not str(raw_email).strip():
            rejection_reasons.append("MISSING_EMAIL")
        else:
            cleaned_email = str(raw_email).strip().lower()
            if not EMAIL_REGEX.match(cleaned_email):
                rejection_reasons.append("INVALID_EMAIL_FORMAT")

        # 4. Order Date validation
        raw_date = raw_record.get("order_date")
        order_date_val = None
        if not raw_date:
            rejection_reasons.append("MISSING_ORDER_DATE")
        elif isinstance(raw_date, date):
            order_date_val = raw_date
        elif isinstance(raw_date, str):
            try:
                order_date_val = datetime.fromisoformat(raw_date.replace("Z", "+00:00")).date()
            except Exception:
                try:
                    order_date_val = datetime.strptime(raw_date[:10], "%Y-%m-%d").date()
                except Exception:
                    rejection_reasons.append("INVALID_ORDER_DATE_FORMAT")
        else:
            rejection_reasons.append("INVALID_ORDER_DATE_FORMAT")

        # If any validation rule failed, return None with reasons
        if rejection_reasons:
            return None, rejection_reasons

        cleaned_record = {
            "order_id": order_id,
            "customer_email": cleaned_email,
            "amount": amount_val,
            "order_date": order_date_val.isoformat() if isinstance(order_date_val, date) else str(order_date_val),
            "etl_loaded_at": load_timestamp.isoformat(),
            "etl_job_id": job_id,
        }
        return cleaned_record, []

    @classmethod
    def process_batch(
        cls, raw_records: List[Dict[str, Any]], job_id: str
    ) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]], Dict[str, int]]:
        """
        Cleanses a batch of raw records.
        
        Returns:
            (valid_records, rejected_records, metrics_breakdown)
        """
        valid_records: List[Dict[str, Any]] = []
        rejected_records: List[Dict[str, Any]] = []
        
        metrics = {
            "extracted_records": len(raw_records),
            "valid_records_loaded": 0,
            "total_filtered_records": 0,
            "filtered_by_missing_amount": 0,
            "filtered_by_invalid_email": 0,
        }

        load_ts = datetime.now(timezone.utc)

        for record in raw_records:
            cleaned, reasons = cls.validate_and_transform_record(record, job_id, load_ts)
            if cleaned is not None:
                valid_records.append(cleaned)
            else:
                rejected_records.append({
                    "job_id": job_id,
                    "raw_record": record,
                    "rejection_reasons": reasons,
                    "created_at": load_ts.isoformat(),
                })
                metrics["total_filtered_records"] += 1
                if any(r in ("MISSING_OR_NULL_AMOUNT", "NON_POSITIVE_AMOUNT", "INVALID_AMOUNT_FORMAT") for r in reasons):
                    metrics["filtered_by_missing_amount"] += 1
                if any(r in ("INVALID_EMAIL_FORMAT", "MISSING_EMAIL") for r in reasons):
                    metrics["filtered_by_invalid_email"] += 1

        metrics["valid_records_loaded"] = len(valid_records)
        return valid_records, rejected_records, metrics
