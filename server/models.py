import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, DateTime
from server.database import Base


class WireTransfer(Base):
    __tablename__ = "wire_transfers"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    beneficiaryName = Column(String(255), nullable=False)
    accountNumber = Column(String(64), nullable=False)
    routingNumber = Column(String(32), nullable=False)
    amount = Column(Float, nullable=False)
    status = Column(String(20), nullable=False, default="PENDING")
    createdBy = Column(String(64), nullable=False)
    approvedBy = Column(String(64), nullable=True)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
