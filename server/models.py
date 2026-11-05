"""Data models and schemas for the Sales Order ETL Pipeline."""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict


class SalesOrderRecord(BaseModel):
    """Pydantic model representing a clean, validated sales order record."""

    model_config = ConfigDict(from_attributes=True)

    order_id: str = Field(..., description="Unique sales order identifier")
    customer_id: str = Field(..., description="Unique customer identifier")
    product_id: str = Field(..., description="Unique product SKU/identifier")
    product_category: Optional[str] = Field(
        default=None, description="Product category"
    )
    quantity: int = Field(..., ge=1, description="Quantity of items purchased")
    unit_price: float = Field(..., ge=0.0, description="Unit price per item")
    total_amount: float = Field(..., ge=0.0, description="Total order amount")
    order_status: str = Field(..., description="Order lifecycle status")
    created_at: datetime = Field(
        ..., description="Timestamp when order was originally placed"
    )
    ingested_at: datetime = Field(
        ..., description="Timestamp when record was ingested into pipeline"
    )
    batch_id: str = Field(..., description="UUID identifier for ETL execution batch")


class ETLBatchMetrics(BaseModel):
    """Execution metrics and audit summary for a batch ETL run."""

    batch_id: str = Field(..., description="Unique batch run identifier")
    raw_records: int = Field(default=0, description="Total raw rows extracted")
    quarantined_records: int = Field(
        default=0, description="Corrupt/invalid rows quarantined"
    )
    deduplicated_records: int = Field(
        default=0, description="Duplicate rows removed based on order_id"
    )
    clean_records_to_load: int = Field(
        default=0, description="Clean validated rows prepared for BigQuery load"
    )
