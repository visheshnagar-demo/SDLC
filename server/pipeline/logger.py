import logging
import json
import sys
from datetime import datetime, timezone
from typing import Any, Dict


def setup_logger(name: str = "etl_pipeline") -> logging.Logger:
    logger = logging.getLogger(name)
    if not logger.handlers:
        logger.setLevel(logging.INFO)
        handler = logging.StreamHandler(sys.stdout)
        formatter = logging.Formatter(
            "[%(levelname)s] %(asctime)s - %(name)s: %(message)s",
            datefmt="%Y-%m-%dT%H:%M:%SZ"
        )
        handler.setFormatter(formatter)
        logger.addHandler(handler)
    return logger


pipeline_logger = setup_logger("etl_pipeline")


def log_audit_event(event_type: str, details: Dict[str, Any]) -> None:
    payload = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "event_type": event_type,
        "details": details
    }
    pipeline_logger.info(f"AUDIT_EVENT: {json.dumps(payload, default=str)}")
