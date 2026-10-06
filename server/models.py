import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column,
    String,
    Float,
    Integer,
    Boolean,
    Date,
    DateTime,
    ForeignKey,
    Text,
)
from sqlalchemy.orm import DeclarativeBase, relationship


class Base(DeclarativeBase):
    pass


def generate_uuid() -> str:
    return str(uuid.uuid4())


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class Cattle(Base):
    __tablename__ = "cattle"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    tag_number = Column(String(64), unique=True, nullable=False, index=True)
    rfid_tag = Column(String(64), unique=True, nullable=False, index=True)
    breed = Column(String(64), nullable=False, default="Holstein-Friesian")
    gender = Column(String(16), nullable=False, default="Female")
    date_of_birth = Column(Date, nullable=False)
    dam_id = Column(
        String(36), ForeignKey("cattle.id", ondelete="SET NULL"), nullable=True
    )
    sire_id = Column(
        String(36), ForeignKey("cattle.id", ondelete="SET NULL"), nullable=True
    )
    status = Column(String(32), nullable=False, default="Active")
    body_condition_score = Column(
        Float, nullable=True, default=3.0
    )  # BCS scale 1.0 - 5.0
    weight_kg = Column(Float, nullable=True, default=600.0)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(
        DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False
    )

    # Relationships
    dam = relationship("Cattle", foreign_keys=[dam_id], remote_side=[id])
    sire = relationship("Cattle", foreign_keys=[sire_id], remote_side=[id])
    milk_logs = relationship(
        "MilkLog", back_populates="cow", cascade="all, delete-orphan"
    )
    breeding_records = relationship(
        "BreedingRecord", back_populates="cow", cascade="all, delete-orphan"
    )
    health_records = relationship(
        "HealthRecord", back_populates="cow", cascade="all, delete-orphan"
    )


class MilkLog(Base):
    __tablename__ = "milk_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    cow_id = Column(
        String(36),
        ForeignKey("cattle.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    milking_date = Column(Date, nullable=False, index=True)
    session = Column(
        String(16), nullable=False, default="Morning"
    )  # Morning, Evening, Afternoon
    yield_liters = Column(Float, nullable=False)
    fat_percentage = Column(Float, nullable=True)
    protein_percentage = Column(Float, nullable=True)
    somatic_cell_count = Column(Integer, nullable=True)
    is_withheld = Column(Boolean, nullable=False, default=False)
    variance_alert = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    cow = relationship("Cattle", back_populates="milk_logs")


class BreedingRecord(Base):
    __tablename__ = "breeding_records"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    cow_id = Column(
        String(36),
        ForeignKey("cattle.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    stage = Column(
        String(32), nullable=False, default="In Heat"
    )  # In Heat, Inseminated, Confirmed Pregnant, Dry Period, Calved, Failed Conception
    event_date = Column(Date, nullable=False)
    insemination_date = Column(Date, nullable=True)
    sire_rfid_or_code = Column(String(64), nullable=True)
    gestation_check_due_date = Column(Date, nullable=True)
    expected_calving_date = Column(Date, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(
        DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False
    )

    cow = relationship("Cattle", back_populates="breeding_records")


class HealthRecord(Base):
    __tablename__ = "health_records"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    cow_id = Column(
        String(36),
        ForeignKey("cattle.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    record_type = Column(
        String(32), nullable=False, default="Treatment"
    )  # Treatment, Vaccination, Routine Check, Surgery, Scheduled Visit
    diagnosis = Column(String(255), nullable=False)
    medication_administered = Column(String(255), nullable=True)
    dosage = Column(String(64), nullable=True)
    treatment_date = Column(DateTime(timezone=True), nullable=False, default=utc_now)
    scheduled_date = Column(DateTime(timezone=True), nullable=True)
    status = Column(
        String(32), nullable=False, default="Completed"
    )  # Completed, Scheduled, Overdue, Cancelled
    milk_withdrawal_hours = Column(Integer, nullable=False, default=0)
    milk_withdrawal_end = Column(DateTime(timezone=True), nullable=True, index=True)
    meat_withdrawal_days = Column(Integer, nullable=False, default=0)
    veterinarian_name = Column(String(128), nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    cow = relationship("Cattle", back_populates="health_records")


class FeedRation(Base):
    __tablename__ = "feed_rations"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    ration_name = Column(String(128), nullable=False)
    target_group = Column(
        String(64), nullable=False
    )  # High Yield, Mid Yield, Dry Cows, Heifers
    dry_matter_kg_per_day = Column(Float, nullable=False, default=20.0)
    silage_pct = Column(Float, nullable=False, default=60.0)
    concentrate_pct = Column(Float, nullable=False, default=25.0)
    forage_supplements_pct = Column(Float, nullable=False, default=15.0)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)


class FeedInventory(Base):
    __tablename__ = "feed_inventory"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    feed_name = Column(String(128), unique=True, nullable=False)
    category = Column(
        String(64), nullable=False
    )  # Forage, Concentrate, Mineral/Supplement
    current_stock_kg = Column(Float, nullable=False, default=0.0)
    daily_consumption_kg = Column(Float, nullable=False, default=0.0)
    reorder_threshold_kg = Column(Float, nullable=False, default=0.0)
    reorder_alert = Column(Boolean, nullable=False, default=False)
    updated_at = Column(
        DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False
    )
