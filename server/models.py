import uuid
from datetime import datetime, date
from sqlalchemy import (
    Column,
    String,
    Text,
    Float,
    Boolean,
    Date,
    DateTime,
    ForeignKey,
    Numeric,
    func
)
from sqlalchemy.orm import relationship, declarative_base

Base = declarative_base()


class Location(Base):
    __tablename__ = "locations"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(100), nullable=False)
    zone_type = Column(String(50), nullable=False)
    temp_min_celsius = Column(Float, default=18.0, nullable=False)
    temp_max_celsius = Column(Float, default=22.0, nullable=False)
    humidity_min_percent = Column(Float, default=45.0, nullable=False)
    humidity_max_percent = Column(Float, default=55.0, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    artifacts = relationship("Artifact", back_populates="location", cascade="all, delete-orphan")
    readings = relationship("EnvironmentalReading", back_populates="location", cascade="all, delete-orphan")


class Artifact(Base):
    __tablename__ = "artifacts"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    accession_no = Column(String(50), unique=True, index=True, nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String(100), nullable=False)
    medium = Column(String(100), nullable=True)
    creation_era = Column(String(100), nullable=True)
    origin = Column(String(150), nullable=True)
    accession_date = Column(Date, nullable=False, default=date.today)
    current_location_id = Column(String(36), ForeignKey("locations.id"), nullable=False)
    status = Column(String(50), nullable=False, default="On Display")
    condition_rating = Column(String(50), nullable=False, default="Good")
    image_url = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    location = relationship("Location", back_populates="artifacts")
    restorations = relationship("RestorationRecord", back_populates="artifact", cascade="all, delete-orphan")
    inspections = relationship("Inspection", back_populates="artifact", cascade="all, delete-orphan")
    loans = relationship("MuseumLoan", back_populates="artifact", cascade="all, delete-orphan")


class RestorationRecord(Base):
    __tablename__ = "restoration_records"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    artifact_id = Column(String(36), ForeignKey("artifacts.id"), nullable=False)
    conservator_name = Column(String(150), nullable=False)
    treatment_date = Column(Date, nullable=False, default=date.today)
    technique = Column(String(150), nullable=False)
    materials_used = Column(Text, nullable=False)
    assessment_notes = Column(Text, nullable=False)
    condition_before = Column(String(50), nullable=False)
    condition_after = Column(String(50), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    artifact = relationship("Artifact", back_populates="restorations")


class EnvironmentalReading(Base):
    __tablename__ = "environmental_readings"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    location_id = Column(String(36), ForeignKey("locations.id"), nullable=False)
    temperature_celsius = Column(Float, nullable=False)
    humidity_percentage = Column(Float, nullable=False)
    is_breach = Column(Boolean, default=False, index=True, nullable=False)
    breach_details = Column(String(255), nullable=True)
    reading_timestamp = Column(DateTime, default=datetime.utcnow, index=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    location = relationship("Location", back_populates="readings")


class Inspection(Base):
    __tablename__ = "inspections"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    artifact_id = Column(String(36), ForeignKey("artifacts.id"), nullable=False)
    assigned_inspector = Column(String(150), nullable=False)
    scheduled_date = Column(Date, nullable=False, index=True)
    completed_date = Column(Date, nullable=True)
    inspection_status = Column(String(50), nullable=False, default="Scheduled")
    surface_condition = Column(String(50), nullable=True)
    pest_activity = Column(Boolean, default=False, nullable=False)
    structural_integrity = Column(String(50), nullable=True)
    findings_notes = Column(Text, nullable=True)
    next_recommended_inspection_date = Column(Date, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    artifact = relationship("Artifact", back_populates="inspections")


class MuseumLoan(Base):
    __tablename__ = "museum_loans"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    artifact_id = Column(String(36), ForeignKey("artifacts.id"), nullable=False)
    partner_museum_name = Column(String(200), nullable=False)
    contact_person = Column(String(150), nullable=False)
    contact_email = Column(String(150), nullable=False)
    loan_start_date = Column(Date, nullable=False)
    loan_end_date = Column(Date, nullable=False)
    indemnity_valuation = Column(Float, nullable=False)
    transit_requirements = Column(Text, nullable=True)
    loan_status = Column(String(50), nullable=False, default="Requested")
    return_inspection_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    artifact = relationship("Artifact", back_populates="loans")
