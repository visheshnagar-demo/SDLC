"""Data models and type definitions for Sales Order ETL."""
from dataclasses import dataclass
from datetime import datetime
from typing import Optional


@dataclass
class SalesRecord:
    """Represents a sanitized and validated sales record ready for BigQuery loading."""
    order_id: int
    customer_id: str
    customer_name: Optional[str]
    customer_email: Optional[str]
    product_category: Optional[str]
    amount: Optional[float]
    currency: Optional[str]
    order_status: Optional[str]
    created_at: datetime
    _etl_ingested_at: datetime
    _etl_batch_id: str
    _etl_source_file: str


@dataclass
class PipelineMetrics:
    """Telemetry metrics collected throughout ETL pipeline execution."""
    batch_id: str
    source_uri: str
    records_extracted: int = 0
    records_validated: int = 0
    quarantined_count: int = 0
    duplicates_removed: int = 0
    records_loaded: int = 0
    execution_duration_ms: float = 0.0
    status: str = "PENDING"
