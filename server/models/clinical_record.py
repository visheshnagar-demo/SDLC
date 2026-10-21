import uuid
from sqlalchemy import Column, String, Text, ForeignKey, DateTime, Date, func
from sqlalchemy.orm import relationship
from server.database import Base

class ClinicalRecord(Base):
    __tablename__ = "clinical_records"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    appointment_id = Column(String(36), ForeignKey("appointments.id"), unique=True, nullable=False)
    patient_id = Column(String(36), ForeignKey("patients.id"), index=True, nullable=False)
    doctor_id = Column(String(36), ForeignKey("doctors.id"), nullable=False)
    symptoms = Column(Text, nullable=True)
    diagnosis = Column(Text, nullable=False)
    prescription = Column(Text, nullable=False)
    notes = Column(Text, nullable=True)
    follow_up_date = Column(String(30), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    appointment = relationship("Appointment", back_populates="clinical_record")
    patient = relationship("Patient")
    doctor = relationship("Doctor")
