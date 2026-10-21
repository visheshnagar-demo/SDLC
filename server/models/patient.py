import uuid
from sqlalchemy import Column, Date, DateTime, ForeignKey, String, Text, func
from sqlalchemy.orm import relationship
from server.models import Base


class Patient(Base):
    __tablename__ = "patients"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    patient_code = Column(String(32), unique=True, nullable=False, index=True)
    first_name = Column(String(100), nullable=False, index=True)
    last_name = Column(String(100), nullable=False, index=True)
    date_of_birth = Column(Date, nullable=False)
    gender = Column(String(20), nullable=False)  # MALE, FEMALE, OTHER, UNDISCLOSED
    phone_number = Column(String(30), nullable=False, index=True)
    email = Column(String(255), nullable=True)
    address = Column(Text, nullable=True)
    emergency_contact_name = Column(String(255), nullable=False)
    emergency_contact_phone = Column(String(30), nullable=False)
    insurance_provider = Column(String(150), nullable=True)
    insurance_policy_number = Column(String(100), nullable=True, index=True)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(
        DateTime, nullable=False, server_default=func.now(), onupdate=func.now()
    )

    user = relationship("User", foreign_keys=[user_id])
    appointments = relationship(
        "Appointment", back_populates="patient", cascade="all, delete-orphan"
    )
