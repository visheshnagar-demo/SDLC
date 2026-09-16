import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, DateTime
from server.database import Base


class WireTransfer(Base):
    __tablename__ = "wire_transfers"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    beneficiary_name = Column(String(255), nullable=False)
    account_number = Column(String(64), nullable=False)
    routing_number = Column(String(64), nullable=False)
    amount = Column(Float, nullable=False)
    status = Column(String(20), nullable=False, default="PENDING")
    created_by = Column(String(100), nullable=False)
    approved_by = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    @property
    def beneficiaryName(self) -> str:
        return self.beneficiary_name

    @property
    def accountNumber(self) -> str:
        return self.account_number

    @property
    def routingNumber(self) -> str:
        return self.routing_number

    @property
    def createdBy(self) -> str:
        return self.created_by

    @property
    def approvedBy(self) -> str | None:
        return self.approved_by
