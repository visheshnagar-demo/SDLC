from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, Field


class PipelineRunRequest(BaseModel):
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    batch_size: int = Field(default=1000, ge=1, le=50000)
    force_reload: bool = False


class PipelineMetrics(BaseModel):
    extracted_count: int = 0
    filtered_missing_amount: int = 0
    filtered_invalid_email: int = 0
    total_filtered: int = 0
    loaded_count: int = 0


class PipelineRunResponse(BaseModel):
    status: str
    job_id: str
    start_time: str
    end_time: str
    duration_seconds: float
    metrics: PipelineMetrics


class HealthResponse(BaseModel):
    status: str
    database_connected: bool
    bigquery_accessible: bool


class RawSalesOrderSchema(BaseModel):
    order_id: str
    customer_id: Optional[str] = None
    customer_email: Optional[str] = None
    order_date: date
    amount: Optional[float] = None
    currency: Optional[str] = "USD"
    status: Optional[str] = "pending"
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class ValidatedSalesOrder(BaseModel):
    order_id: str
    customer_id: Optional[str] = None
    customer_email: str
    order_date: date
    amount: float
    currency: str = "USD"
    status: str = "pending"
    source_created_at: Optional[str] = None
    ingested_at: str

    model_config = {"from_attributes": True}
