"""Structured logging and metrics collection module for Cloud Logging and observability."""

import json
import logging
import sys
import uuid
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from typing import Any, Optional


@dataclass
class PipelineMetrics:
    """Metrics container for ETL execution tracking."""

    run_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    start_time: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    end_time: Optional[datetime] = None
    duration_seconds: float = 0.0
    source_uri: str = ""
    target_table: str = ""
    rows_extracted: int = 0
    rows_transformed: int = 0
    rows_loaded: int = 0
    rows_rejected: int = 0
    status: str = "PENDING"
    error_message: Optional[str] = None

    def finish(self, status: str = "SUCCESS", error_message: Optional[str] = None) -> None:
        """Mark metrics as finished."""
        self.end_time = datetime.now(timezone.utc)
        self.duration_seconds = round((self.end_time - self.start_time).total_seconds(), 4)
        self.status = status
        self.error_message = error_message

    def to_dict(self) -> dict[str, Any]:
        """Convert metrics to serializable dictionary."""
        data = asdict(self)
        data["start_time"] = self.start_time.isoformat()
        data["end_time"] = self.end_time.isoformat() if self.end_time else None
        return data


class StructuredLogger:
    """JSON structured logger adhering to Cloud Logging standards."""

    def __init__(self, name: str = "etl_pipeline", level: str = "INFO"):
        self.logger = logging.getLogger(name)
        self.logger.setLevel(getattr(logging, level.upper(), logging.INFO))
        self.logger.handlers = []

        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(self._JsonFormatter())
        self.logger.addHandler(handler)

    class _JsonFormatter(logging.Formatter):
        def format(self, record: logging.LogRecord) -> str:
            payload: dict[str, Any] = {
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "severity": record.levelname,
                "message": record.getMessage(),
                "logger": record.name,
            }
            if hasattr(record, "extra_data") and isinstance(record.extra_data, dict):
                payload.update(record.extra_data)
            if record.exc_info:
                payload["exception"] = self.formatException(record.exc_info)
            return json.dumps(payload)

    def info(self, message: str, extra: Optional[dict[str, Any]] = None) -> None:
        self.logger.info(message, extra={"extra_data": extra or {}})

    def warning(self, message: str, extra: Optional[dict[str, Any]] = None) -> None:
        self.logger.warning(message, extra={"extra_data": extra or {}})

    def error(self, message: str, extra: Optional[dict[str, Any]] = None, exc_info: bool = False) -> None:
        self.logger.error(message, extra={"extra_data": extra or {}}, exc_info=exc_info)


structured_logger = StructuredLogger()
