import uuid
from sqlalchemy import Column, String, Date, DateTime, Text, ForeignKey, func
from sqlalchemy.orm import relationship
from server.database import Base

class Patient(Base):
    __tablename__ = "patients"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    patient_code = Column(String(32), unique=True, index=True, nullable=False)
    first_name = Column(String(100), index=True, nullable=False)
    last_name = Column(String(100), index=True, nullable=False)
    date_of_birth = Column(String(30), nullable=False)
    gender = Column(String(20), nullable=False)
    phone_number = Column(String(30), index=True, nullable=False)
    email = Column(String(255), nullable=True)
    address = Column(Text, nullable=True)
    emergency_contact_name = Column(String(255), nullable=False)
    emergency_contact_phone = Column(String(30), nullable=False)
    insurance_provider = Column(String(150), nullable=True)
    insurance_policy_number = Column(String(100), index=True, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    user = relationship("User", foreign_keys=[user_id])
    appointments = relationship("Appointment", back_populates="patient", cascade="all, delete-orphan")
