import uuid
from datetime import datetime, timezone
from sqlalchemy import Boolean, Column, DateTime, ForeignKey, String, Text
from server.app.core.database import Base


class Encounter(Base):
    __tablename__ = "encounters"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    patient_id = Column(
        String(36), ForeignKey("patients.id"), nullable=False, index=True
    )
    doctor_id = Column(String(36), ForeignKey("doctors.id"), nullable=False, index=True)
    appointment_id = Column(
        String(36), ForeignKey("appointments.id"), nullable=True, unique=True
    )
    encounter_date = Column(
        DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )
    chief_complaint = Column(Text, nullable=False)
    status = Column(String(30), default="OPEN", nullable=False)  # OPEN, FINALIZED
    created_at = Column(
        DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )


class ClinicalNote(Base):
    __tablename__ = "clinical_notes"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    encounter_id = Column(
        String(36), ForeignKey("encounters.id"), nullable=False, index=True
    )
    doctor_id = Column(String(36), ForeignKey("doctors.id"), nullable=False)
    note_text = Column(Text, nullable=False)
    diagnosis = Column(Text, nullable=False)
    is_signed = Column(Boolean, default=False, nullable=False)
    signed_at = Column(DateTime, nullable=True)
    created_at = Column(
        DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )


class ClinicalNoteAddendum(Base):
    __tablename__ = "clinical_note_addendums"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    note_id = Column(
        String(36), ForeignKey("clinical_notes.id"), nullable=False, index=True
    )
    author_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    addendum_text = Column(Text, nullable=False)
    created_at = Column(
        DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )


class Prescription(Base):
    __tablename__ = "prescriptions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    encounter_id = Column(
        String(36), ForeignKey("encounters.id"), nullable=False, index=True
    )
    medication_name = Column(String(150), nullable=False)
    dosage = Column(String(100), nullable=False)
    frequency = Column(String(100), nullable=False)
    duration = Column(String(50), nullable=False)
    instructions = Column(Text, nullable=True)
    created_at = Column(
        DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )


class LabOrder(Base):
    __tablename__ = "lab_orders"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    encounter_id = Column(
        String(36), ForeignKey("encounters.id"), nullable=False, index=True
    )
    test_name = Column(String(150), nullable=False)
    priority = Column(
        String(50), default="ROUTINE", nullable=False
    )  # STAT, URGENT, ROUTINE
    status = Column(
        String(50), default="ORDERED", nullable=False
    )  # ORDERED, IN_PROGRESS, COMPLETED
    notes = Column(Text, nullable=True)
    created_at = Column(
        DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )
