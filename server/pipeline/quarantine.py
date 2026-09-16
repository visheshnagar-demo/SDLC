"""Quarantine manager and audit logger for rejected records."""
import json
import logging
from typing import Any, Dict, List
from server.models import PipelineMetrics, QuarantineRecord

logger = logging.getLogger(__name__)


class QuarantineManager:
    """Manages quarantined records and computes audit quality metrics."""

    def __init__(self):
        self.records: List[QuarantineRecord] = []

    def record_quarantine(self, quarantine_item: QuarantineRecord):
        """Append a quarantined record."""
        self.records.append(quarantine_item)

    def record_batch(self, quarantine_items: List[QuarantineRecord]):
        """Append a list of quarantined records."""
        self.records.extend(quarantine_items)

    def compute_metrics(self, extracted_count: int, valid_count: int, loaded_count: int = 0) -> PipelineMetrics:
        """Compute detailed data quality metrics across all records."""
        missing_amount = sum(1 for r in self.records if r.error_code == "ERR_MISSING_OR_INVALID_AMOUNT")
        invalid_email = sum(1 for r in self.records if r.error_code == "ERR_INVALID_EMAIL_FORMAT")
        missing_order_id = sum(1 for r in self.records if r.error_code == "ERR_MISSING_ORDER_ID")
        invalid_order_date = sum(1 for r in self.records if r.error_code == "ERR_INVALID_ORDER_DATE")

        return PipelineMetrics(
            records_extracted=extracted_count,
            records_valid=valid_count,
            records_quarantined=len(self.records),
            filtered_missing_amount=missing_amount,
            filtered_invalid_email=invalid_email,
            filtered_missing_order_id=missing_order_id,
            filtered_invalid_order_date=invalid_order_date,
            records_loaded=loaded_count,
        )

    def get_summary_report(self) -> Dict[str, Any]:
        """Generate structured audit summary."""
        breakdown = {}
        for r in self.records:
            breakdown[r.error_code] = breakdown.get(r.error_code, 0) + 1

        return {
            "total_quarantined": len(self.records),
            "reasons_breakdown": breakdown,
            "sample_records": [
                {
                    "order_id": r.order_id,
                    "error_code": r.error_code,
                    "rejection_reason": r.rejection_reason,
                    "timestamp": r.timestamp.isoformat(),
                }
                for r in self.records[:10]
            ],
        }

    def log_quarantine_summary(self):
        """Emit structured JSON log for auditability."""
        summary = self.get_summary_report()
        logger.warning(f"Quarantine Audit Summary: {json.dumps(summary, indent=2)}")
