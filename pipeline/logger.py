"""Structured JSON logging for ETL execution observability."""
import json
import logging
import sys
from datetime import datetime
from typing import Any, Dict


class JSONFormatter(logging.Formatter):
    """Custom JSON formatter for structured Cloud Logging output."""

    def format(self, record: logging.LogRecord) -> str:
        log_entry: Dict[str, Any] = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "severity": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }
        if record.exc_info:
            log_entry["exception"] = self.formatException(record.exc_info)
        # Include custom metric attributes if attached
        for attr in ["extracted_rows", "cleaned_rows", "deduplicated_rows", "loaded_rows", "duration_ms"]:
            if hasattr(record, attr):
                log_entry[attr] = getattr(record, attr)
        return json.dumps(log_entry)


def get_logger(name: str = "sales_order_etl") -> logging.Logger:
    """Configures and returns a structured logger."""
    logger = logging.getLogger(name)
    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(JSONFormatter())
        logger.addHandler(handler)
        logger.setLevel(logging.INFO)
        logger.propagate = False
    return logger
