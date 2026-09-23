"""SQLAlchemy model for Priority Recommendations."""

import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Float, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from server.database import Base


class PriorityRecommendation(Base):
    __tablename__ = "priority_recommendations"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    study_plan_id = Column(
        String(36), ForeignKey("study_plans.id", ondelete="CASCADE"), nullable=False
    )
    subject_id = Column(
        String(36), ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False
    )
    priority_rank = Column(Integer, nullable=False)
    urgency_score = Column(Float, nullable=False)
    recommendation_text = Column(Text, nullable=False)
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

    study_plan = relationship("StudyPlan", back_populates="priorities")
    subject = relationship("Subject", back_populates="priority_recommendations")
