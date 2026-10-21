import uuid
from sqlalchemy import Column, Date, DateTime, ForeignKey, String, Text, func
from sqlalchemy.orm import relationship
from server.models import Base


class ClinicalRecord(Base):
    __tablename__ = "clinical_records"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    appointment_id = Column(
        String(36), ForeignKey("appointments.id"), unique=True, nullable=False
    )
    patient_id = Column(
        String(36), ForeignKey("patients.id"), nullable=False, index=True
    )
    doctor_id = Column(String(36), ForeignKey("doctors.id"), nullable=False, index=True)
    symptoms = Column(Text, nullable=True)
    diagnosis = Column(Text, nullable=False)
    prescription = Column(Text, nullable=False)
    notes = Column(Text, nullable=True)
    follow_up_date = Column(Date, nullable=True)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(
        DateTime, nullable=False, server_default=func.now(), onupdate=func.now()
    )

    appointment = relationship("Appointment", back_populates="clinical_record")
    patient = relationship("Patient", foreign_keys=[patient_id])
    doctor = relationship("Doctor", foreign_keys=[doctor_id])
