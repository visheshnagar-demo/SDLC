import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, DateTime, String, Text
from server.app.core.database import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), nullable=True, index=True)
    action = Column(
        String(100), nullable=False
    )  # e.g. VIEW_PATIENT, REGISTER_PATIENT, BOOK_APPOINTMENT, CREATE_NOTE
    entity_type = Column(
        String(100), nullable=False
    )  # Patient, Appointment, ClinicalNote, Prescription
    entity_id = Column(String(36), nullable=True, index=True)
    details = Column(Text, nullable=True)  # JSON string
    ip_address = Column(String(50), nullable=True)
    timestamp = Column(
        DateTime, default=lambda: datetime.now(timezone.utc), index=True, nullable=False
    )
