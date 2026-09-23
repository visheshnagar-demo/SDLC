"""ETL Logging & Metrics Audit Module."""
import logging
import json
from dataclasses import dataclass, asdict
from datetime import datetime

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] [%(name)s] %(message)s",
)

def get_logger(name: str = "etl_pipeline") -> logging.Logger:
    """Returns a structured logger instance."""
    return logging.getLogger(name)

@dataclass
class ETLMetrics:
    rows_extracted: int = 0
    rows_cleaned: int = 0
    duplicates_dropped: int = 0
    rows_loaded: int = 0
    duration_seconds: float = 0.0

    def to_dict(self) -> dict:
        return asdict(self)
