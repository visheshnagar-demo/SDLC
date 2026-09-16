from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, Field


class ETLJobRequest(BaseModel):
    start_date: Optional[date] = Field(
        default=None,
        description="Filter records on or after this order_date (YYYY-MM-DD)",
    )
    end_date: Optional[date] = Field(
        default=None,
        description="Filter records on or before this order_date (YYYY-MM-DD)",
    )
    batch_size: int = Field(
        default=1000,
        ge=1,
        le=50000,
        description="Batch chunk size for extraction and loading",
    )


class ETLJobBreakdown(BaseModel):
    missing_amount: int = Field(
        default=0, description="Records dropped due to null or missing amount"
    )
    invalid_email: int = Field(
        default=0, description="Records dropped due to invalid email address format"
    )


class ETLJobMetrics(BaseModel):
    records_extracted: int = Field(
        default=0, description="Total raw records extracted from source"
    )
    records_loaded: int = Field(
        default=0, description="Cleaned records successfully loaded into BigQuery"
    )
    records_quarantined: int = Field(
        default=0, description="Total records rejected by data quality engine"
    )
    breakdown: ETLJobBreakdown = Field(
        default_factory=ETLJobBreakdown, description="Categorized drop reasons"
    )
    duration_ms: int = Field(
        default=0, description="Total execution duration in milliseconds"
    )


class ETLJobResponse(BaseModel):
    job_id: str = Field(description="Unique ETL execution identifier")
    status: str = Field(description="Execution status: COMPLETED, FAILED, RUNNING")
    metrics: Optional[ETLJobMetrics] = Field(
        default=None, description="Execution metrics"
    )
    timestamp: datetime = Field(
        default_factory=datetime.utcnow, description="Completion timestamp"
    )
    error_message: Optional[str] = Field(
        default=None, description="Error details if job failed"
    )


class ETLJobStatusResponse(BaseModel):
    job_id: str = Field(description="Unique ETL execution identifier")
    status: str = Field(description="Current status: RUNNING, COMPLETED, FAILED")
    progress_percentage: float = Field(
        default=100.0, description="Job progress percentage (0.0 to 100.0)"
    )
    metrics: Optional[ETLJobMetrics] = Field(
        default=None, description="Job metrics summary"
    )
    started_at: Optional[datetime] = Field(default=None, description="Start timestamp")
    completed_at: Optional[datetime] = Field(default=None, description="End timestamp")


class RawSalesOrderSchema(BaseModel):
    order_id: str
    customer_id: Optional[str] = None
    customer_email: Optional[str] = None
    order_date: date
    amount: Optional[float] = None
    currency: Optional[str] = "USD"
    status: Optional[str] = "COMPLETED"
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class CleanSalesOrderSchema(BaseModel):
    order_id: str
    customer_id: Optional[str] = None
    customer_email: str
    order_date: date
    amount: float
    currency: Optional[str] = "USD"
    status: Optional[str] = "COMPLETED"
    ingested_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        from_attributes = True
