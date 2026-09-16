import json
import logging
from typing import Any, Dict

logger = logging.getLogger("etl_pipeline")


def log_pipeline_metrics(metrics: Dict[str, Any], duration_seconds: float) -> None:
    """Log structured execution summary and metrics."""
    summary = {
        "event": "ETL_EXECUTION_SUMMARY",
        "duration_seconds": round(duration_seconds, 3),
        "extracted_count": metrics.get("extracted_count", 0),
        "filtered_missing_amount": metrics.get("filtered_missing_amount", 0),
        "filtered_invalid_email": metrics.get("filtered_invalid_email", 0),
        "total_filtered": metrics.get("total_filtered", 0),
        "loaded_count": metrics.get("loaded_count", 0),
    }
    logger.info(json.dumps(summary))


def log_dropped_record(record: Dict[str, Any], reason: str) -> None:
    """Log dropped record for audit trail."""
    order_id = record.get("order_id", "UNKNOWN")
    logger.warning(f"Validator: Dropped record order_id={order_id} (Reason: {reason})")
