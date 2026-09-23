"""Data models and schemas for sales order processing and audit telemetry."""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class SalesOrderRaw(BaseModel):
    """Raw sales order schema as ingested directly from source CSV."""

    order_id: str
    customer_id: str
    customer_name: str
    customer_email: Optional[str] = None
    product_category: Optional[str] = None
    amount: Optional[str] = None
    currency: str
    order_status: str
    created_at: str


class SalesOrderCleaned(BaseModel):
    """Sanitized and strongly-typed sales order record."""

    order_id: int
    customer_id: str
    customer_name: str
    customer_email: Optional[str] = None
    product_category: Optional[str] = None
    amount: Optional[float] = None
    currency: str
    order_status: str
    created_at: datetime
    ingested_at: datetime = Field(default_factory=datetime.utcnow)


class PipelineAuditSummary(BaseModel):
    """Structured execution metrics and audit summary."""

    source_uri: str
    destination_table: str
    status: str
    extracted_rows: int
    cleaned_rows: int
    deduplicated_rows: int
    loaded_rows: int
    execution_duration_ms: float
