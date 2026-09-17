import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, DateTime
from server.database import Base


def generate_uuid():
    return str(uuid.uuid4())


class WireTransfer(Base):
    __tablename__ = "wire_transfers"

    id = Column(String, primary_key=True, default=generate_uuid)
    beneficiary_name = Column(String, nullable=False)
    account_number = Column(String, nullable=False)
    routing_number = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    status = Column(String, nullable=False, default="PENDING")
    created_by = Column(String, nullable=False, default="User A")
    approved_by = Column(String, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
