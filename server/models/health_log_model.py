import uuid
import datetime
from sqlalchemy import (
    Column,
    String,
    Integer,
    Float,
    Boolean,
    DateTime,
    ForeignKey,
    Text,
)
from sqlalchemy.orm import relationship
from server.database import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


def get_utc_now() -> datetime.datetime:
    return datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None)


class HealthLog(Base):
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
    request_headers = Column(Text, nullable=True)
    response_body = Column(Text, nullable=True)
    checked_at = Column(DateTime, default=get_utc_now, nullable=False, index=True)

    api = relationship("ApiEndpoint", back_populates="logs")
