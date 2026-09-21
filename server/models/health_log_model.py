import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column,
    String,
    Integer,
    Float,
    Boolean,
    Text,
    JSON,
    DateTime,
    ForeignKey,
)
from sqlalchemy.orm import relationship
from server.database import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class HealthLogModel(Base):
    __tablename__ = "health_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    api_id = Column(
        String(36),
        ForeignKey("apis.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    response_status = Column(Integer, nullable=True)
    latency_ms = Column(Float, nullable=False)
    operational_status = Column(String(20), nullable=False, index=True)
    is_success = Column(Boolean, nullable=False, index=True)
    error_message = Column(Text, nullable=True)
    request_headers = Column(JSON, nullable=True)
    response_body = Column(String(2048), nullable=True)
    checked_at = Column(
        DateTime(timezone=True), nullable=False, default=utc_now, index=True
    )

    api = relationship("APIModel", back_populates="logs")
