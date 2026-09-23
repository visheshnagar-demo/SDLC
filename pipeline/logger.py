"""Pipeline Logger Module.

Provides structured logging and metric audit summaries for the Cloud Run Job.
"""
import json
import logging
import sys
from datetime import datetime


def get_logger(name: str = "sales_etl") -> logging.Logger:
    """Configures and returns a logger instance."""
    logger = logging.getLogger(name)
    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        formatter = logging.Formatter(
            "%(asctime)s [%(levelname)s] [%(name)s] %(message)s"
        )
        handler.setFormatter(formatter)
        logger.addHandler(handler)
        logger.setLevel(logging.INFO)
    return logger


def log_execution_summary(
    logger: logging.Logger,
    source_uri: str,
    target_table: str,
    rows_extracted: int,
    rows_cleaned: int,
    rows_quarantined: int,
    duplicates_removed: int,
    rows_loaded: int,
    duration_seconds: float,
    status: str = "SUCCESS",
):
    """Emits a structured JSON log summary of the ETL execution."""
    summary = {
        "event": "ETL_EXECUTION_SUMMARY",
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "source_uri": source_uri,
        "target_table": target_table,
        "rows_extracted": rows_extracted,
        "rows_cleaned": rows_cleaned,
        "rows_quarantined": rows_quarantined,
        "duplicates_removed": duplicates_removed,
        "rows_loaded": rows_loaded,
        "duration_seconds": round(duration_seconds, 2),
        "status": status,
    }
    logger.info("EXECUTION SUMMARY: %s", json.dumps(summary))
