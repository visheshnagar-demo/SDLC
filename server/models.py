import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column,
    String,
    Boolean,
    Float,
    Integer,
    Text,
    DateTime,
    Date,
    ForeignKey,
    JSON,
)
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    phone_number = Column(String(50), nullable=True)
    role = Column(String(50), nullable=False, default="PATIENT", index=True)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    patient_profile = relationship(
        "Patient", back_populates="user", uselist=False, cascade="all, delete-orphan"
    )
    doctor_profile = relationship(
        "Doctor", back_populates="user", uselist=False, cascade="all, delete-orphan"
    )
    audit_logs = relationship("AuditLog", back_populates="user")


class Patient(Base):
    __tablename__ = "patients"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), unique=True, nullable=False)
    national_id = Column(String(100), unique=True, nullable=False, index=True)
    date_of_birth = Column(Date, nullable=False)
    gender = Column(String(20), nullable=False)
    blood_group = Column(String(10), nullable=True)
    address = Column(Text, nullable=True)
    emergency_contact_name = Column(String(255), nullable=False)
    emergency_contact_phone = Column(String(50), nullable=False)
    insurance_provider = Column(String(255), nullable=True)
    insurance_policy_number = Column(String(100), nullable=True)
    created_at = Column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    user = relationship("User", back_populates="patient_profile")
    appointments = relationship(
        "Appointment", back_populates="patient", cascade="all, delete-orphan"
    )
    ehr_records = relationship(
        "EHRRecord", back_populates="patient", cascade="all, delete-orphan"
    )


class Doctor(Base):
    __tablename__ = "doctors"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), unique=True, nullable=False)
    department = Column(String(100), nullable=False, index=True)
    specialization = Column(String(255), nullable=False)
    consultation_fee = Column(Float, nullable=False, default=0.0)
    slot_duration_minutes = Column(Integer, nullable=False, default=30)
    is_available = Column(Boolean, nullable=False, default=True)
    created_at = Column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    user = relationship("User", back_populates="doctor_profile")
    appointments = relationship(
        "Appointment", back_populates="doctor", cascade="all, delete-orphan"
    )
    ehr_records = relationship(
        "EHRRecord", back_populates="doctor", cascade="all, delete-orphan"
    )


class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    patient_id = Column(
        String(36), ForeignKey("patients.id"), nullable=False, index=True
    )
    doctor_id = Column(String(36), ForeignKey("doctors.id"), nullable=False, index=True)
    start_time = Column(DateTime(timezone=True), nullable=False, index=True)
    end_time = Column(DateTime(timezone=True), nullable=False)
    status = Column(
        String(50), nullable=False, default="SCHEDULED"
    )  # SCHEDULED, CHECKED_IN, COMPLETED, CANCELLED
    reason = Column(Text, nullable=True)
    cancellation_reason = Column(Text, nullable=True)
    created_at = Column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    patient = relationship("Patient", back_populates="appointments")
    doctor = relationship("Doctor", back_populates="appointments")
    ehr_record = relationship("EHRRecord", back_populates="appointment", uselist=False)


class EHRRecord(Base):
    __tablename__ = "ehr_records"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    patient_id = Column(
        String(36), ForeignKey("patients.id"), nullable=False, index=True
    )
    doctor_id = Column(String(36), ForeignKey("doctors.id"), nullable=False, index=True)
    appointment_id = Column(String(36), ForeignKey("appointments.id"), nullable=True)
    diagnosis = Column(Text, nullable=False)
    clinical_notes = Column(Text, nullable=False)
    prescriptions = Column(
        JSON, nullable=False, default=list
    )  # list of {medication_name, dosage, frequency, duration_days}
    lab_orders = Column(
        JSON, nullable=False, default=list
    )  # list of str or test details
    created_at = Column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    patient = relationship("Patient", back_populates="ehr_records")
    doctor = relationship("Doctor", back_populates="ehr_records")
    appointment = relationship("Appointment", back_populates="ehr_record")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=True, index=True)
    action = Column(
        String(100), nullable=False, index=True
    )  # READ_EHR, CREATE_EHR, BOOK_APPOINTMENT, etc.
    resource_type = Column(
        String(100), nullable=False
    )  # PATIENT, EHR_RECORD, APPOINTMENT, AUTH
    resource_id = Column(String(255), nullable=True)
    ip_address = Column(String(50), nullable=True)
    user_agent = Column(Text, nullable=True)
    details = Column(JSON, nullable=True)
    timestamp = Column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True
    )

    user = relationship("User", back_populates="audit_logs")
