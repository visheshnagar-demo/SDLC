"""Data models and schemas for PostgreSQL to BigQuery ETL pipeline."""
from datetime import date, datetime
from decimal import Decimal
from typing import Any, Dict, List, Optional
from uuid import uuid4
from pydantic import BaseModel, Field
from sqlalchemy import Column, Date, DateTime, Float, Numeric, String
from sqlalchemy.orm import declarative_base

Base = declarative_base()


class RawSalesOrderModel(Base):
    """SQLAlchemy model for source table raw_sales_orders."""

    __tablename__ = "raw_sales_orders"

    order_id = Column(String(64), primary_key=True)
    customer_email = Column(String(255), nullable=True)
    amount = Column(Numeric(12, 2), nullable=True)
    order_date = Column(Date, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=True)


class FctSalesOrderModel(Base):
    """SQLAlchemy model for target table fct_sales_orders_v1 (used in testing & staging)."""

    __tablename__ = "fct_sales_orders_v1"

    order_id = Column(String(64), primary_key=True)
    customer_email = Column(String(255), nullable=False)
    amount = Column(Numeric(12, 2), nullable=False)
    order_date = Column(Date, nullable=False)
    ingestion_timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
    pipeline_run_id = Column(String(64), nullable=False)


# Pydantic Schemas

class RawSalesOrder(BaseModel):
    """Schema representing a raw sales order extracted from PostgreSQL."""

    order_id: str
    customer_email: Optional[str] = None
    amount: Optional[float] = None
    order_date: date
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class FctSalesOrder(BaseModel):
    """Schema representing a validated, transformed sales order loaded into BigQuery."""

    order_id: str
    customer_email: str
    amount: float
    order_date: date
    ingestion_timestamp: datetime = Field(default_factory=datetime.utcnow)
    pipeline_run_id: str

    class Config:
        from_attributes = True


class PipelineRunResult(BaseModel):
    """Execution metrics and summary for an ETL pipeline run."""

    pipeline_run_id: str
    status: str
    extracted_records: int = 0
    filtered_missing_amount: int = 0
    filtered_invalid_email: int = 0
    loaded_records: int = 0
    duration_ms: int = 0
    quarantined_records: Optional[List[Dict[str, Any]]] = None
    error_message: Optional[str] = None


class ETLRunRequest(BaseModel):
    """Optional parameters when triggering an ETL run via API."""

    execution_date: Optional[str] = None
    batch_size: Optional[int] = 1000
    dry_run: Optional[bool] = False


class ETLRunResponse(BaseModel):
    """Response returned upon initiating or finishing an ETL run."""

    success: bool
    data: PipelineRunResult
    message: str
