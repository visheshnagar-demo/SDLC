import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, DateTime
from server.database import Base


def utc_now():
    return datetime.now(timezone.utc)


class WireTransfer(Base):
    __tablename__ = "wire_transfers"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    beneficiaryName = Column(String(255), nullable=False)
    accountNumber = Column(String(60), nullable=False)
    routingNumber = Column(String(30), nullable=False)
    amount = Column(Float, nullable=False)
    status = Column(String(20), nullable=False, default="PENDING")
    createdBy = Column(String(100), nullable=False)
    approvedBy = Column(String(100), nullable=True, default=None)
    created_at = Column(DateTime, nullable=False, default=utc_now)
    updated_at = Column(DateTime, nullable=False, default=utc_now, onupdate=utc_now)
