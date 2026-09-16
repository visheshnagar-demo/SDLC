"""Quarantine Manager module for handling rejected sales order records."""
import logging
from datetime import datetime, timezone
from typing import Dict, Any, List

logger = logging.getLogger("server.pipeline.quarantine")


class QuarantineManager:
    """Manages dead-letter logging and quality audit metrics for quarantined records."""

    def __init__(self):
        self.quarantined_records: List[Dict[str, Any]] = []
        self.reason_counts: Dict[str, int] = {
            "ERR_MISSING_OR_INVALID_AMOUNT": 0,
            "ERR_INVALID_EMAIL_FORMAT": 0,
            "ERR_INVALID_ORDER_DATE": 0,
            "ERR_MISSING_ORDER_ID": 0,
        }

    def record_rejection(self, record: Dict[str, Any], reason_code: str, detail: str = ""):
        self.reason_counts[reason_code] = self.reason_counts.get(reason_code, 0) + 1
        quarantine_entry = {
            "record": record,
            "reason_code": reason_code,
            "detail": detail,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
        self.quarantined_records.append(quarantine_entry)
        logger.warning(
            "Record rejected [%s]: %s (Order ID: %s)",
            reason_code,
            detail,
            record.get("order_id"),
        )

    @property
    def total_quarantined(self) -> int:
        return len(self.quarantined_records)
