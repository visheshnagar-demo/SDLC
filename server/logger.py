"""Structured JSON logging for Cloud Run Jobs and Google Cloud Logging."""
import json
import logging
import sys
from datetime import datetime


class JSONFormatter(logging.Formatter):
    """Formats log records as structured JSON for GCP Cloud Logging."""

    def format(self, record: logging.LogRecord) -> str:
        log_payload = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "severity": record.levelname,
            "message": record.getMessage(),
            "logger": record.name,
            "module": record.module,
            "lineno": record.lineno,
        }
        if hasattr(record, "batch_id"):
            log_payload["batch_id"] = getattr(record, "batch_id")
        if hasattr(record, "metrics"):
            log_payload["metrics"] = getattr(record, "metrics")
        if record.exc_info:
            log_payload["exception"] = self.formatException(record.exc_info)
        return json.dumps(log_payload)


def setup_logger(name: str = "sales_order_etl", level: int = logging.INFO) -> logging.Logger:
    """Configures and returns a logger instance with structured output."""
    logger = logging.getLogger(name)
    logger.setLevel(level)
    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(JSONFormatter())
        logger.addHandler(handler)
    logger.propagate = False
    return logger


logger = setup_logger()
