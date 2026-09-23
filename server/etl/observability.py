"""Observability and structured audit logging for ETL execution."""
import json
import logging
import sys
import time
from dataclasses import asdict, dataclass, field
from typing import Optional


@dataclass
class AuditMetrics:
    job_id: str
    source_table: str
    target_table: str
    rows_extracted: int = 0
    rows_cleaned: int = 0
    rows_deduplicated: int = 0
    rows_dropped_or_quarantined: int = 0
    rows_loaded: int = 0
    execution_duration_sec: float = 0.0
    status: str = "PENDING"
    error_message: Optional[str] = None
    quarantined_records: list = field(default_factory=list)

    def to_dict(self) -> dict:
        data = asdict(self)
        # Quarantined sample limit to prevent log bloat
        if len(data.get("quarantined_records", [])) > 20:
            data["quarantined_records"] = data["quarantined_records"][:20]
        return data


class StructuredLogger:
    def __init__(self, name: str = "etl_pipeline"):
        self.logger = logging.getLogger(name)
        if not self.logger.handlers:
            handler = logging.StreamHandler(sys.stdout)
            formatter = logging.Formatter("%(message)s")
            handler.setFormatter(formatter)
            self.logger.addHandler(handler)
            self.logger.setLevel(logging.INFO)

    def log(self, level: str, message: str, **kwargs):
        payload = {
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "level": level.upper(),
            "message": message,
            **kwargs,
        }
        log_line = json.dumps(payload)
        if level.lower() == "error":
            self.logger.error(log_line)
        elif level.lower() == "warning":
            self.logger.warning(log_line)
        else:
            self.logger.info(log_line)

    def info(self, message: str, **kwargs):
        self.log("info", message, **kwargs)

    def warning(self, message: str, **kwargs):
        self.log("warning", message, **kwargs)

    def error(self, message: str, **kwargs):
        self.log("error", message, **kwargs)

    def emit_audit(self, metrics: AuditMetrics):
        self.info("ETL_JOB_AUDIT_METRICS", **metrics.to_dict())


logger = StructuredLogger()
