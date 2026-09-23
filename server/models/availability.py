"""SQLAlchemy model for Weekly Availability Profiles."""

import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, DateTime
from server.database import Base


class AvailabilityProfile(Base):
    __tablename__ = "availability_profiles"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    day_of_week = Column(String(20), nullable=False, unique=True)
    available_minutes = Column(Integer, nullable=False, default=120)
    preferred_time_of_day = Column(String(30), default="EVENING", nullable=False)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
