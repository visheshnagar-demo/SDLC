import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Numeric, Boolean, DateTime, Index
from server.app.db.base import Base


class AchTransfer(Base):
    __tablename__ = "ach_transfers"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    account_id = Column(String(36), nullable=False, index=True)
    amount = Column(Numeric(12, 2), nullable=False)
    direction = Column(String(10), nullable=False, default="OUTBOUND")
    transfer_type = Column(String(20), nullable=False, default="ACH")
    status = Column(String(20), nullable=False, default="APPROVED")
    requires_aml_review = Column(Boolean, nullable=False, default=False)
    correlation_id = Column(String(36), nullable=False)
    recipient_account = Column(String(34), nullable=True)
    routing_number = Column(String(9), nullable=True)
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        index=True,
    )
    updated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    __table_args__ = (
        Index(
            "idx_ach_outbound_velocity",
            "account_id",
            "direction",
            "created_at",
            "status",
        ),
    )
