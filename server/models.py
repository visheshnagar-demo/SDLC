import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Float, Text, ForeignKey, DateTime, JSON
from sqlalchemy.orm import relationship
from server.database import Base


class Itinerary(Base):
    __tablename__ = "itineraries"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    destination = Column(String(255), nullable=False)
    budget = Column(Float, nullable=False)
    currency = Column(String(10), default="USD", nullable=False)
    duration_days = Column(Integer, nullable=False)
    interests = Column(JSON, default=list)
    total_estimated_cost = Column(Float, default=0.0)
    budget_status = Column(String(50), default="WITHIN_BUDGET")
    share_token = Column(String(64), unique=True, index=True, nullable=True)
    created_at = Column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    days = relationship(
        "ItineraryDay",
        back_populates="itinerary",
        cascade="all, delete-orphan",
        order_by="ItineraryDay.day_number",
    )


class ItineraryDay(Base):
    __tablename__ = "itinerary_days"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    itinerary_id = Column(
        String(36), ForeignKey("itineraries.id", ondelete="CASCADE"), nullable=False
    )
    day_number = Column(Integer, nullable=False)
    date = Column(String(50), nullable=True)
    daily_estimated_cost = Column(Float, default=0.0)
    created_at = Column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
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

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    day_id = Column(
        String(36), ForeignKey("itinerary_days.id", ondelete="CASCADE"), nullable=False
    )
    time_slot = Column(String(50), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String(100), nullable=False)
    estimated_cost = Column(Float, default=0.0)
    location = Column(String(255), default="")
    duration_minutes = Column(Integer, default=60)
    sequence_order = Column(Integer, default=0)
    created_at = Column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    day = relationship("ItineraryDay", back_populates="activities")
