import uuid
from sqlalchemy import Column, String, Text, ForeignKey, DateTime, func
from sqlalchemy.orm import relationship
from server.database import Base

class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    appointment_code = Column(String(32), unique=True, index=True, nullable=False)
    patient_id = Column(String(36), ForeignKey("patients.id"), index=True, nullable=False)
    doctor_id = Column(String(36), ForeignKey("doctors.id"), index=True, nullable=False)
    scheduled_start = Column(DateTime(timezone=True), index=True, nullable=False)
    scheduled_end = Column(DateTime(timezone=True), nullable=False)
    status = Column(String(30), index=True, nullable=False, default="CONFIRMED")  # PENDING, CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED
    reason_for_visit = Column(Text, nullable=True)
    cancellation_reason = Column(Text, nullable=True)
    created_by = Column(String(36), ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    patient = relationship("Patient", back_populates="appointments")
    doctor = relationship("Doctor", back_populates="appointments")
    creator = relationship("User", foreign_keys=[created_by])
    clinical_record = relationship("ClinicalRecord", back_populates="appointment", uselist=False, cascade="all, delete-orphan")
