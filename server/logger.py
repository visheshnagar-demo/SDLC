"""Logging configuration for Sales Order ETL."""
import logging
import sys


def get_logger(name: str = "sales_order_etl") -> logging.Logger:
    """Returns a configured structured logger instance."""
    log = logging.getLogger(name)
    if not log.handlers:
        handler = logging.StreamHandler(sys.stdout)
        handler.setLevel(logging.INFO)
        formatter = logging.Formatter(
            '{"timestamp": "%(asctime)s", "severity": "%(levelname)s", "logger": "%(name)s", "message": "%(message)s"}'
        )
        handler.setFormatter(formatter)
        log.addHandler(handler)
        log.setLevel(logging.INFO)
    return log


logger = get_logger("sales_order_etl")
