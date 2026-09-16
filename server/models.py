import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, DateTime
from server.database import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class WireTransfer(Base):
    __tablename__ = "wire_transfers"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    beneficiary_name = Column(String(255), nullable=False)
    account_number = Column(String(50), nullable=False)
    routing_number = Column(String(50), nullable=False)
    amount = Column(Float, nullable=False)
    status = Column(String(20), nullable=False, default="PENDING")
    created_by = Column(String(100), nullable=False)
    approved_by = Column(String(100), nullable=True)
    created_at = Column(DateTime, nullable=False, default=utc_now)
    updated_at = Column(DateTime, nullable=False, default=utc_now, onupdate=utc_now)
