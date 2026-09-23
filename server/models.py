"""Data models and type definitions for Sales Order ETL."""
from dataclasses import dataclass
from datetime import datetime
from typing import Optional


@dataclass
class SalesRecord:
    """Represents a sanitized and validated sales record ready for BigQuery loading."""
    order_id: int
    customer_id: str
    customer_name: Optional[str] = None
    customer_email: Optional[str] = None
    product_category: Optional[str] = None
    amount: Optional[float] = None
    currency: Optional[str] = None
    order_status: Optional[str] = None
    created_at: Optional[datetime] = None
    _etl_ingested_at: Optional[datetime] = None
    _etl_batch_id: Optional[str] = None
    _etl_source_file: Optional[str] = None


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
