import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column,
    String,
    Boolean,
    Float,
    Date,
    DateTime,
    ForeignKey,
    Text,
)
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()


def generate_uuid() -> str:
    return str(uuid.uuid4())


def get_utc_now() -> datetime:
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(100), nullable=False)
    role = Column(
        String(50), nullable=False, default="farm_worker"
    )  # farm_manager or farm_worker
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, nullable=False, default=get_utc_now)
    updated_at = Column(
        DateTime, nullable=False, default=get_utc_now, onupdate=get_utc_now
    )

    milk_logs = relationship("MilkYieldLog", back_populates="user")


class Cow(Base):
    __tablename__ = "cows"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    tag_id = Column(String(50), unique=True, nullable=False, index=True)
    breed = Column(String(100), nullable=False)
    date_of_birth = Column(Date, nullable=False)
    gender = Column(String(20), nullable=False)  # Female, Male
    health_status = Column(
        String(50), nullable=False, default="Healthy"
    )  # Healthy, Under Treatment, Sick, Quarantined, Dry
    weight_kg = Column(Float, nullable=False)
    location = Column(String(100), nullable=False)
    created_at = Column(DateTime, nullable=False, default=get_utc_now)
    updated_at = Column(
        DateTime, nullable=False, default=get_utc_now, onupdate=get_utc_now
    )

    health_records = relationship(
        "HealthRecord",
        back_populates="cow",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    milk_yield_logs = relationship(
        "MilkYieldLog",
        back_populates="cow",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )


class HealthRecord(Base):
    __tablename__ = "health_records"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    cow_id = Column(
        String(36),
        ForeignKey("cows.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    record_type = Column(
        String(50), nullable=False
    )  # Vaccination, Checkup, Treatment, Deworming
    title = Column(String(150), nullable=False)
    diagnosis = Column(Text, nullable=True)
    treatment_plan = Column(Text, nullable=True)
    event_date = Column(Date, nullable=False)
    next_due_date = Column(Date, nullable=True)
    administered_by = Column(String(100), nullable=False)
    created_at = Column(DateTime, nullable=False, default=get_utc_now)
    updated_at = Column(
        DateTime, nullable=False, default=get_utc_now, onupdate=get_utc_now
    )

    cow = relationship("Cow", back_populates="health_records")


class MilkYieldLog(Base):
    __tablename__ = "milk_yield_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    cow_id = Column(
        String(36),
        ForeignKey("cows.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    logging_date = Column(Date, nullable=False, index=True)
    morning_yield_liters = Column(Float, nullable=False, default=0.0)
    evening_yield_liters = Column(Float, nullable=False, default=0.0)
    total_yield_liters = Column(Float, nullable=False, default=0.0)
    yield_drop_alert = Column(Boolean, nullable=False, default=False)
    notes = Column(Text, nullable=True)
    logged_by = Column(String(36), ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, nullable=False, default=get_utc_now)
    updated_at = Column(
        DateTime, nullable=False, default=get_utc_now, onupdate=get_utc_now
    )

    cow = relationship("Cow", back_populates="milk_yield_logs")
    user = relationship("User", back_populates="milk_logs")
