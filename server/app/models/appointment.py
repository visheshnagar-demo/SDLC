import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from server.app.core.database import Base


class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    patient_id = Column(
        String(36), ForeignKey("patients.id"), nullable=False, index=True
    )
    doctor_id = Column(String(36), ForeignKey("doctors.id"), nullable=False, index=True)
    appointment_time = Column(DateTime, nullable=False, index=True)
    duration_minutes = Column(Integer, default=30, nullable=False)
    status = Column(
        String(30), default="SCHEDULED", nullable=False
    )  # SCHEDULED, CONFIRMED, CANCELLED, COMPLETED
    reason = Column(Text, nullable=True)
    created_at = Column(
        DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
