import uuid
import datetime
from sqlalchemy import (
    Column,
    String,
    Integer,
    Float,
    Boolean,
    DateTime,
    Text,
)
from sqlalchemy.orm import relationship
from server.database import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


def get_utc_now() -> datetime.datetime:
    return datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None)


class ApiEndpoint(Base):
    __tablename__ = "apis"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(120), nullable=False, index=True)
    target_url = Column(String(1024), nullable=False)
    http_method = Column(String(10), nullable=False, default="GET")
    interval_seconds = Column(Integer, nullable=False, default=60)
    expected_status = Column(Integer, nullable=False, default=200)
    timeout_seconds = Column(Float, nullable=False, default=5.0)
    request_headers = Column(Text, nullable=True)  # JSON string
    request_body = Column(Text, nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)
    current_status = Column(String(20), nullable=False, default="Healthy")
    last_latency_ms = Column(Float, nullable=True)
    last_checked_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=get_utc_now, nullable=False)
    updated_at = Column(
        DateTime,
        default=get_utc_now,
        onupdate=get_utc_now,
        nullable=False,
    )

    logs = relationship(
        "HealthLog",
        back_populates="api",
        cascade="all, delete-orphan",
        order_by="desc(HealthLog.checked_at)",
    )
