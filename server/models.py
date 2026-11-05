from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class SalesOrderRecord(BaseModel):
    order_id: str = Field(..., description="Unique sales order identifier")
    customer_id: str = Field(..., description="Unique customer identifier")
    product_id: str = Field(..., description="Unique product identifier")
    product_category: Optional[str] = Field(
        default=None, description="Product category"
    )
    quantity: int = Field(..., description="Quantity ordered")
    unit_price: float = Field(..., description="Unit price of the product")
    total_amount: float = Field(..., description="Total order amount")
    order_status: str = Field(..., description="Order processing status")
    created_at: datetime = Field(..., description="Order creation timestamp")
    ingested_at: datetime = Field(
        default_factory=datetime.utcnow, description="Pipeline ingestion timestamp"
    )
    batch_id: str = Field(..., description="ETL batch run UUID")


class ETLBatchMetrics(BaseModel):
    batch_id: str = Field(..., description="ETL batch run identifier")
    raw_records: int = Field(
        default=0, description="Total raw records read from source"
    )
    quarantined_records: int = Field(
        default=0, description="Records failed validation / quarantined"
    )
    deduplicated_records: int = Field(
        default=0, description="Duplicate records eliminated"
    )
    clean_records_to_load: int = Field(
        default=0, description="Valid deduplicated records loaded into BigQuery"
    )
