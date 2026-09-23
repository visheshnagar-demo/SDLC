"""Structured telemetry and logging helper."""
import json
import logging
from datetime import datetime

logger = logging.getLogger(__name__)


def log_execution_summary(
    pipeline_id: str,
    status: str,
    records_extracted: int,
    records_cleaned: int,
    records_rejected: int,
    records_loaded: int,
    duration_ms: float,
    issue_key: str = "SCRUM-366",
):
    """Emits structured JSON metrics log for GCP Cloud Logging."""
    summary = {
        "event": "etl_execution_summary",
        "pipeline": pipeline_id,
        "issue_key": issue_key,
        "status": status,
        "records_extracted": records_extracted,
        "records_cleaned": records_cleaned,
        "records_rejected": records_rejected,
        "records_loaded": records_loaded,
        "execution_duration_ms": duration_ms,
        "timestamp": datetime.utcnow().isoformat() + "Z",
    }
    logger.info("EXECUTION_TELEMETRY: %s", json.dumps(summary))
    return summary
