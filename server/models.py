"""Database models and Pydantic schemas for the Sales ETL Pipeline."""
import uuid
from datetime import date, datetime, timezone
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import Column, Date, DateTime, Float, Numeric, String, Text
from server.database import Base


class RawSalesOrder(Base):
    """Source PostgreSQL table: raw_sales_orders."""
    __tablename__ = "raw_sales_orders"

    order_id = Column(String(64), primary_key=True, index=True)
    customer_email = Column(String(255), nullable=True)
    amount = Column(Numeric(12, 2), nullable=True)
    order_date = Column(Date, nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))


class QuarantineRecordModel(Base):
    """Dead-letter queue / quarantine records table."""
    __tablename__ = "quarantine_sales_orders"

    quarantine_id = Column(String(64), primary_key=True, default=lambda: f"dlq_{uuid.uuid4()}")
    job_id = Column(String(64), nullable=False, index=True)
    raw_record = Column(Text, nullable=False)
    rejection_reasons = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class ETLJobLog(Base):
    """Audit log table for ETL pipeline executions."""
    __tablename__ = "etl_job_logs"

    job_id = Column(String(64), primary_key=True, default=lambda: f"job_{uuid.uuid4()}")
    status = Column(String(32), nullable=False, default="RUNNING")
    started_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    completed_at = Column(DateTime(timezone=True), nullable=True)
    duration_seconds = Column(Float, nullable=True)
    extracted_records = Column(Numeric, default=0)
    valid_records_loaded = Column(Numeric, default=0)
    total_filtered_records = Column(Numeric, default=0)
    filtered_by_missing_amount = Column(Numeric, default=0)
    filtered_by_invalid_email = Column(Numeric, default=0)
    error_message = Column(Text, nullable=True)


# ============================================================================
# Pydantic Contracts
# ============================================================================

class SalesOrderRaw(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    order_id: str
    customer_email: Optional[str] = None
    amount: Optional[float] = None
    order_date: date
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class SalesOrderCleaned(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    order_id: str
    customer_email: str
    amount: float
    order_date: date
    etl_loaded_at: datetime
    etl_job_id: str


class QuarantineRecord(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    quarantine_id: str
    job_id: str
    raw_record: Dict[str, Any]
    rejection_reasons: List[str]
    created_at: datetime


class ETLJobRunRequest(BaseModel):
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    batch_size: int = Field(default=5000, ge=1, le=50000)
    dry_run: bool = False


class ETLJobRunResponse(BaseModel):
    job_id: str
    status: str
    started_at: datetime
    message: str


class ETLMetrics(BaseModel):
    extracted_records: int
    valid_records_loaded: int
    total_filtered_records: int
    filtered_by_missing_amount: int
    filtered_by_invalid_email: int


class BigQueryDestinationInfo(BaseModel):
    project_id: str
    dataset: str
    table: str
    partition_field: str


class ETLJobStatusResponse(BaseModel):
    job_id: str
    status: str
    started_at: datetime
    completed_at: Optional[datetime] = None
    duration_seconds: Optional[float] = None
    metrics: ETLMetrics
    destination: BigQueryDestinationInfo
    error_message: Optional[str] = None


class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
    connections: Dict[str, str]
