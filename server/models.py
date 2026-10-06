import uuid
from sqlalchemy import (
    Column,
    String,
    Integer,
    Float,
    Boolean,
    Text,
    DateTime,
    ForeignKey,
    func,
)
from sqlalchemy.orm import relationship
from server.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(
        String(50), nullable=False, default="Patient"
    )  # Admin, Doctor, Patient, Nurse, Staff
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime, server_default=func.now(), onupdate=func.now(), nullable=False
    )

    patients = relationship(
        "Patient", back_populates="user", cascade="all, delete-orphan"
    )
    doctors = relationship(
        "Doctor", back_populates="user", cascade="all, delete-orphan"
    )


class Patient(Base):
    __tablename__ = "patients"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    mrn = Column(String(50), unique=True, index=True, nullable=False)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    date_of_birth = Column(String(20), nullable=False)
    gender = Column(String(20), nullable=False)
    phone = Column(String(50), nullable=False)
    email = Column(String(255), index=True, nullable=False)
    address = Column(String(255), nullable=True)
    emergency_contact_name = Column(String(100), nullable=True)
    emergency_contact_phone = Column(String(50), nullable=True)
    emergency_contact_relationship = Column(String(50), nullable=True)
    insurance_provider = Column(String(100), nullable=True)
    insurance_policy_number = Column(String(100), nullable=True)
    insurance_group_number = Column(String(100), nullable=True)
    insurance_status = Column(String(50), default="Active")
    allergies = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime, server_default=func.now(), onupdate=func.now(), nullable=False
    )

    user = relationship("User", back_populates="patients")
    appointments = relationship(
        "Appointment", back_populates="patient", cascade="all, delete-orphan"
    )
    encounters = relationship(
        "ClinicalEncounter", back_populates="patient", cascade="all, delete-orphan"
    )
    invoices = relationship(
        "Invoice", back_populates="patient", cascade="all, delete-orphan"
    )


class Doctor(Base):
    __tablename__ = "doctors"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    name = Column(String(150), nullable=False)
    specialty = Column(String(100), nullable=False)
    department = Column(String(100), nullable=False)
    consultation_fee = Column(Float, default=100.0, nullable=False)
    available_days = Column(String(100), default="Mon,Tue,Wed,Thu,Fri")
    slot_duration_minutes = Column(Integer, default=30)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    user = relationship("User", back_populates="doctors")
    appointments = relationship("Appointment", back_populates="doctor")
    encounters = relationship("ClinicalEncounter", back_populates="doctor")


class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    patient_id = Column(String(36), ForeignKey("patients.id"), nullable=False)
    doctor_id = Column(String(36), ForeignKey("doctors.id"), nullable=False)
    appointment_date = Column(String(20), nullable=False)
    start_time = Column(String(20), nullable=False)
    end_time = Column(String(20), nullable=False)
    reason = Column(Text, nullable=True)
    appointment_type = Column(String(100), default="Consultation")
    status = Column(
        String(50), default="Scheduled", nullable=False
    )  # Scheduled, In Progress, Completed, Cancelled
    lock_token = Column(String(100), nullable=True)
    lock_expires_at = Column(DateTime, nullable=True)
    version = Column(Integer, default=1, nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime, server_default=func.now(), onupdate=func.now(), nullable=False
    )

    patient = relationship("Patient", back_populates="appointments")
    doctor = relationship("Doctor", back_populates="appointments")
    encounters = relationship("ClinicalEncounter", back_populates="appointment")


class ClinicalEncounter(Base):
    __tablename__ = "clinical_encounters"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    appointment_id = Column(String(36), ForeignKey("appointments.id"), nullable=True)
    patient_id = Column(String(36), ForeignKey("patients.id"), nullable=False)
    doctor_id = Column(String(36), ForeignKey("doctors.id"), nullable=False)
    chief_complaint = Column(String(255), nullable=True)
    clinical_notes = Column(Text, nullable=True)
    vitals = Column(Text, nullable=True)  # JSON-encoded string or key-value summary
    diagnosis_codes = Column(
        Text, nullable=True
    )  # JSON-encoded or comma-separated ICD-10
    status = Column(
        String(50), default="In Progress", nullable=False
    )  # In Progress, Closed, Completed
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime, server_default=func.now(), onupdate=func.now(), nullable=False
    )

    patient = relationship("Patient", back_populates="encounters")
    doctor = relationship("Doctor", back_populates="encounters")
    appointment = relationship("Appointment", back_populates="encounters")
    prescriptions = relationship(
        "Prescription", back_populates="encounter", cascade="all, delete-orphan"
    )
    lab_orders = relationship(
        "LabOrder", back_populates="encounter", cascade="all, delete-orphan"
    )
    invoices = relationship("Invoice", back_populates="encounter")


class Prescription(Base):
    __tablename__ = "prescriptions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    encounter_id = Column(
        String(36), ForeignKey("clinical_encounters.id"), nullable=False
    )
    patient_id = Column(String(36), ForeignKey("patients.id"), nullable=False)
    medication = Column(String(200), nullable=False)
    dosage = Column(String(100), nullable=False)
    frequency = Column(String(100), nullable=False)
    duration = Column(String(100), nullable=False)
    instructions = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    encounter = relationship("ClinicalEncounter", back_populates="prescriptions")


class LabOrder(Base):
    __tablename__ = "lab_orders"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    encounter_id = Column(
        String(36), ForeignKey("clinical_encounters.id"), nullable=False
    )
    patient_id = Column(String(36), ForeignKey("patients.id"), nullable=False)
    test_name = Column(String(200), nullable=False)
    priority = Column(String(50), default="Routine")
    status = Column(String(50), default="Ordered")
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    encounter = relationship("ClinicalEncounter", back_populates="lab_orders")


class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    encounter_id = Column(
        String(36), ForeignKey("clinical_encounters.id"), nullable=True
    )
    patient_id = Column(String(36), ForeignKey("patients.id"), nullable=False)
    total_amount = Column(Float, default=0.0, nullable=False)
    copay_amount = Column(Float, default=0.0, nullable=False)
    patient_balance = Column(Float, default=0.0, nullable=False)
    status = Column(
        String(50), default="Unpaid", nullable=False
    )  # Unpaid, Paid, Pending Insurance, Overdue, Cancelled
    due_date = Column(String(20), nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime, server_default=func.now(), onupdate=func.now(), nullable=False
    )

    patient = relationship("Patient", back_populates="invoices")
    encounter = relationship("ClinicalEncounter", back_populates="invoices")
    items = relationship(
        "InvoiceItem", back_populates="invoice", cascade="all, delete-orphan"
    )
    payments = relationship(
        "Payment", back_populates="invoice", cascade="all, delete-orphan"
    )


class InvoiceItem(Base):
    __tablename__ = "invoice_items"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    invoice_id = Column(String(36), ForeignKey("invoices.id"), nullable=False)
    description = Column(String(255), nullable=False)
    cpt_code = Column(String(50), nullable=True)
    amount = Column(Float, default=0.0, nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    invoice = relationship("Invoice", back_populates="items")


class Payment(Base):
    __tablename__ = "payments"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    invoice_id = Column(String(36), ForeignKey("invoices.id"), nullable=False)
    amount_paid = Column(Float, nullable=False)
    payment_method = Column(
        String(50), default="Credit Card"
    )  # Credit Card, Bank Transfer, Insurance
    cardholder_name = Column(String(150), nullable=True)
    transaction_reference = Column(String(100), nullable=True)
    payment_status = Column(String(50), default="Success")
    payment_date = Column(DateTime, server_default=func.now(), nullable=False)

    invoice = relationship("Invoice", back_populates="payments")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), nullable=True)
    action = Column(String(100), nullable=False)
    resource_type = Column(String(100), nullable=False)
    resource_id = Column(String(36), nullable=True)
    details = Column(Text, nullable=True)
    timestamp = Column(DateTime, server_default=func.now(), nullable=False)
