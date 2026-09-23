"""SQLAlchemy model for Study Sessions."""

import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Date, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from server.database import Base


class StudySession(Base):
    __tablename__ = "study_sessions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    study_plan_id = Column(
        String(36), ForeignKey("study_plans.id", ondelete="CASCADE"), nullable=False
    )
    subject_id = Column(
        String(36), ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False
    )
    session_date = Column(Date, nullable=False)
    start_time = Column(String(10), nullable=True)
    duration_minutes = Column(Integer, nullable=False, default=45)
    topic_focus = Column(String(255), nullable=True)
    status = Column(String(30), nullable=False, default="PENDING")
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

    study_plan = relationship("StudyPlan", back_populates="sessions")
    subject = relationship("Subject", back_populates="study_sessions")
