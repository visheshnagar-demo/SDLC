"""Structured JSON logger for Cloud SQL to BigQuery ETL pipeline."""
import json
import logging
import sys
from datetime import datetime
from typing import Any, Dict, Optional


class JSONFormatter(logging.Formatter):
    """Formats log records as structured JSON adhering to Google Cloud Logging conventions."""

    def format(self, record: logging.LogRecord) -> str:
        log_entry: Dict[str, Any] = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "severity": record.levelname,
            "component": record.name,
            "message": record.getMessage(),
        }
        if hasattr(record, "metrics"):
            log_entry["metrics"] = record.metrics
        if record.exc_info:
            log_entry["exception"] = self.formatException(record.exc_info)
        return json.dumps(log_entry)


def get_logger(name: str = "etl_pipeline", log_level: str = "INFO") -> logging.Logger:
    """Creates and returns a configured logger."""
    logger = logging.getLogger(name)
    numeric_level = getattr(logging, log_level.upper(), logging.INFO)
    logger.setLevel(numeric_level)

    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(JSONFormatter())
        logger.addHandler(handler)

    return logger
