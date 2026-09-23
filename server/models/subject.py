"""SQLAlchemy model for Subjects."""

import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Float, Date, DateTime
from sqlalchemy.orm import relationship
from server.database import Base


class Subject(Base):
    __tablename__ = "subjects"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(150), nullable=False)
    difficulty_level = Column(Integer, nullable=False, default=3)
    target_date = Column(Date, nullable=False)
    estimated_total_hours = Column(Float, nullable=False, default=10.0)
    color_tag = Column(String(20), default="#3B82F6", nullable=False)
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

    study_sessions = relationship(
        "StudySession", back_populates="subject", cascade="all, delete-orphan"
    )
    priority_recommendations = relationship(
        "PriorityRecommendation", back_populates="subject", cascade="all, delete-orphan"
    )
