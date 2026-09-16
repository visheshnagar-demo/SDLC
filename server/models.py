"""Data models for Sales ETL pipeline."""
from datetime import date, datetime
from decimal import Decimal
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import Column, Date, DateTime, Numeric, String, func
from sqlalchemy.orm import declarative_base

Base = declarative_base()


class RawSalesOrderDB(Base):
    """SQLAlchemy model for PostgreSQL raw_sales_orders table."""

    __tablename__ = "raw_sales_orders"

    order_id = Column(String(64), primary_key=True)
    customer_id = Column(String(64), nullable=True)
    customer_name = Column(String(255), nullable=True)
    customer_email = Column(String(255), nullable=True)
    order_date = Column(Date, nullable=False)
    amount = Column(Numeric(12, 2), nullable=True)
    currency = Column(String(3), default="USD", nullable=True)
    status = Column(String(50), nullable=True)
    created_at = Column(DateTime(timezone=True), default=func.now(), nullable=True)


class SalesOrderRaw(BaseModel):
    """Pydantic model representing raw sales order ingested from PostgreSQL."""

    model_config = ConfigDict(from_attributes=True)

    order_id: Optional[str] = None
    customer_id: Optional[str] = None
    customer_name: Optional[str] = None
    customer_email: Optional[str] = None
    order_date: Optional[date] = None
    amount: Optional[Decimal] = None
    currency: Optional[str] = "USD"
    status: Optional[str] = "PENDING"
    created_at: Optional[datetime] = None


class SalesOrderClean(BaseModel):
    """Pydantic model representing cleaned sales order to load into BigQuery."""

    model_config = ConfigDict(from_attributes=True)

    order_id: str
    customer_id: Optional[str] = None
    customer_name: Optional[str] = None
    customer_email: str
    order_date: date
    amount: float
    currency: str = "USD"
    status: Optional[str] = "PENDING"
    extracted_at: datetime
    loaded_at: datetime


class QuarantineRecord(BaseModel):
    """Model representing an invalid record rejected during cleansing."""

    order_id: Optional[str] = None
    error_code: str
    rejection_reason: str
    raw_record: Dict[str, Any] = Field(default_factory=dict)
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class PipelineMetrics(BaseModel):
    """Execution telemetry and data quality counters."""

    records_extracted: int = 0
    records_valid: int = 0
    records_quarantined: int = 0
    filtered_missing_amount: int = 0
    filtered_invalid_email: int = 0
    filtered_missing_order_id: int = 0
    filtered_invalid_order_date: int = 0
    records_loaded: int = 0


class PipelineRunResult(BaseModel):
    """Complete summary of an ETL execution run."""

    pipeline_name: str = "postgres_to_bigquery_sales_etl"
    run_id: str
    status: str
    start_time: str
    end_time: str
    duration_seconds: float
    metrics: PipelineMetrics
    target_partitions_affected: List[str] = Field(default_factory=list)
    error_message: Optional[str] = None
