import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, DateTime
from server.database import Base


class WireTransfer(Base):
    __tablename__ = "wire_transfers"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    beneficiary_name = Column(String(255), nullable=False)
    account_number = Column(String(64), nullable=False)
    routing_number = Column(String(9), nullable=False)
    amount = Column(Float, nullable=False)
    status = Column(String(20), nullable=False, default="PENDING")
    created_by = Column(String(128), nullable=False)
    approved_by = Column(String(128), nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
