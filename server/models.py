import uuid
from datetime import datetime
from sqlalchemy import (
    Column,
    String,
    Numeric,
    Date,
    DateTime,
    Integer,
    Text,
    func,
)
from sqlalchemy.orm import declarative_base

Base = declarative_base()


class RawSalesOrder(Base):
    __tablename__ = "raw_sales_orders"

    order_id = Column(String(64), primary_key=True, default=lambda: str(uuid.uuid4()))
    customer_id = Column(String(64), nullable=True)
    customer_email = Column(String(255), nullable=True)
    order_date = Column(Date, nullable=False)
    amount = Column(Numeric(12, 2), nullable=True)
    currency = Column(String(10), default="USD", nullable=True)
    status = Column(String(32), default="COMPLETED", nullable=True)
    created_at = Column(
        DateTime, server_default=func.now(), default=datetime.utcnow, nullable=False
    )


class FctSalesOrder(Base):
    """
    Target analytics model representing BigQuery fct_sales_orders partitioned by order_date.
    Also used as local/sqlite backing store for local testing without cloud credentials.
    """

    __tablename__ = "fct_sales_orders"

    order_id = Column(String(64), primary_key=True)
    customer_id = Column(String(64), nullable=True)
    customer_email = Column(String(255), nullable=False)
    order_date = Column(Date, nullable=False, index=True)
    amount = Column(Numeric(12, 2), nullable=False)
    currency = Column(String(10), default="USD", nullable=True)
    status = Column(String(32), default="COMPLETED", nullable=True)
    ingested_at = Column(
        DateTime, server_default=func.now(), default=datetime.utcnow, nullable=False
    )


class ETLJobLog(Base):
    __tablename__ = "etl_job_logs"

    job_id = Column(
        String(64), primary_key=True, default=lambda: f"job_{uuid.uuid4().hex[:12]}"
    )
    status = Column(String(32), default="RUNNING", nullable=False)
    records_extracted = Column(Integer, default=0, nullable=False)
    records_loaded = Column(Integer, default=0, nullable=False)
    records_quarantined = Column(Integer, default=0, nullable=False)
    missing_amount = Column(Integer, default=0, nullable=False)
    invalid_email = Column(Integer, default=0, nullable=False)
    duration_ms = Column(Integer, default=0, nullable=False)
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)
    started_at = Column(
        DateTime, server_default=func.now(), default=datetime.utcnow, nullable=False
    )
    completed_at = Column(DateTime, nullable=True)
    error_message = Column(Text, nullable=True)


class QuarantinedSalesOrder(Base):
    __tablename__ = "quarantined_sales_orders"

    id = Column(String(64), primary_key=True, default=lambda: str(uuid.uuid4()))
    job_id = Column(String(64), nullable=False, index=True)
    order_id = Column(String(64), nullable=True)
    reason = Column(String(64), nullable=False)
    raw_data = Column(Text, nullable=False)
    created_at = Column(
        DateTime, server_default=func.now(), default=datetime.utcnow, nullable=False
    )
