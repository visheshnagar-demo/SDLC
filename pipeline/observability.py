"""Observability and structured logging module."""
import json
import logging
import sys
import time
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Dict


def setup_logger(name: str = "etl_pipeline", level: int = logging.INFO) -> logging.Logger:
    logger = logging.getLogger(name)
    logger.setLevel(level)
    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        formatter = logging.Formatter("%(asctime)s [%(levelname)s] [%(name)s] %(message)s")
        handler.setFormatter(formatter)
        logger.addHandler(handler)
    return logger


@dataclass
class PipelineMetrics:
    extracted_count: int = 0
    cleaned_count: int = 0
    failed_count: int = 0
    loaded_count: int = 0
    start_time: float = field(default_factory=time.time)
    end_time: float = 0.0

    def finalize(self) -> Dict[str, Any]:
        self.end_time = time.time()
        duration = round(self.end_time - self.start_time, 2)
        return {
            "extracted_count": self.extracted_count,
            "cleaned_count": self.cleaned_count,
            "failed_count": self.failed_count,
            "loaded_count": self.loaded_count,
            "execution_duration_sec": duration,
        }

    def log_summary(self, logger: logging.Logger, source_table: str, target_table: str, status: str = "SUCCESS") -> None:
        metrics_dict = self.finalize()
        summary = {
            "event": "etl_execution_summary",
            "timestamp": datetime.utcnow().isoformat(),
            "source_table": source_table,
            "target_table": target_table,
            "status": status,
            "metrics": metrics_dict,
        }
        logger.info("PIPELINE_TELEMETRY: %s", json.dumps(summary))
