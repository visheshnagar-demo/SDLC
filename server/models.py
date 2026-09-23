import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column,
    String,
    Float,
    Integer,
    Text,
    DateTime,
    ForeignKey,
    JSON,
)
from sqlalchemy.orm import relationship
from server.database import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


def get_utc_now() -> datetime:
    return datetime.now(timezone.utc)


class Itinerary(Base):
    __tablename__ = "itineraries"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), nullable=True)
    destination = Column(String(255), nullable=False)
    budget = Column(Float, nullable=False)
    currency = Column(String(10), default="USD", nullable=False)
    duration_days = Column(Integer, nullable=False)
    interests = Column(JSON, default=list, nullable=False)
    total_estimated_cost = Column(Float, default=0.0, nullable=False)
    budget_status = Column(String(50), default="WITHIN_BUDGET", nullable=False)
    share_token = Column(String(64), unique=True, index=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=get_utc_now, nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        default=get_utc_now,
        onupdate=get_utc_now,
        nullable=False,
    )

    days = relationship(
        "ItineraryDay",
        back_populates="itinerary",
        cascade="all, delete-orphan",
        order_by="ItineraryDay.day_number",
    )


class ItineraryDay(Base):
    __tablename__ = "itinerary_days"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    itinerary_id = Column(
        String(36),
        ForeignKey("itineraries.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    day_number = Column(Integer, nullable=False)
    date = Column(String(50), nullable=True)
    daily_estimated_cost = Column(Float, default=0.0, nullable=False)
    created_at = Column(DateTime(timezone=True), default=get_utc_now, nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        default=get_utc_now,
        onupdate=get_utc_now,
        nullable=False,
    )

    itinerary = relationship("Itinerary", back_populates="days")
    activities = relationship(
        "Activity",
        back_populates="day",
        cascade="all, delete-orphan",
        order_by="Activity.sequence_order",
    )


class Activity(Base):
    __tablename__ = "activities"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    day_id = Column(
        String(36),
        ForeignKey("itinerary_days.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    time_slot = Column(String(50), default="Morning", nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String(100), default="General", nullable=False)
    estimated_cost = Column(Float, default=0.0, nullable=False)
    location = Column(String(255), nullable=True)
    duration_minutes = Column(Integer, default=60, nullable=False)
    sequence_order = Column(Integer, default=1, nullable=False)
    created_at = Column(DateTime(timezone=True), default=get_utc_now, nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        default=get_utc_now,
        onupdate=get_utc_now,
        nullable=False,
    )

    day = relationship("ItineraryDay", back_populates="activities")
