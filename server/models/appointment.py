import uuid
from sqlalchemy import Column, DateTime, ForeignKey, String, Text, func
from sqlalchemy.orm import relationship
from server.models import Base


class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    appointment_code = Column(String(32), unique=True, nullable=False, index=True)
    patient_id = Column(
        String(36), ForeignKey("patients.id"), nullable=False, index=True
    )
    doctor_id = Column(String(36), ForeignKey("doctors.id"), nullable=False, index=True)
    scheduled_start = Column(DateTime, nullable=False, index=True)
    scheduled_end = Column(DateTime, nullable=False)
    status = Column(
        String(30), nullable=False, default="CONFIRMED", index=True
    )  # PENDING, CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED
    reason_for_visit = Column(Text, nullable=True)
    cancellation_reason = Column(Text, nullable=True)
    created_by = Column(String(36), ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(
        DateTime, nullable=False, server_default=func.now(), onupdate=func.now()
    )

    patient = relationship("Patient", back_populates="appointments")
    doctor = relationship("Doctor", back_populates="appointments")
    creator = relationship("User", foreign_keys=[created_by])
    clinical_record = relationship(
        "ClinicalRecord",
        back_populates="appointment",
        uselist=False,
        cascade="all, delete-orphan",
    )
