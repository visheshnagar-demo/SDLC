"""Observability and structured logging module."""
import json
import logging
import sys
from datetime import datetime
from typing import Any, Dict


logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] [%(name)s] %(message)s",
    stream=sys.stdout,
)

logger = logging.getLogger("etl_pipeline")


def log_structured_metric(event_name: str, payload: Dict[str, Any]) -> None:
    """Logs a structured JSON telemetry event."""
    log_entry = {
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "event": event_name,
        **payload,
    }
    logger.info(json.dumps(log_entry))
