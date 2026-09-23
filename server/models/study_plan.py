"""SQLAlchemy model for Study Plans."""

import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, Date, DateTime
from sqlalchemy.orm import relationship
from server.database import Base


class StudyPlan(Base):
    __tablename__ = "study_plans"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String(200), nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    total_study_hours = Column(Float, nullable=False, default=0.0)
    status = Column(String(30), nullable=False, default="ACTIVE")
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

    sessions = relationship(
        "StudySession",
        back_populates="study_plan",
        cascade="all, delete-orphan",
        order_by="StudySession.session_date",
    )
    priorities = relationship(
        "PriorityRecommendation",
        back_populates="study_plan",
        cascade="all, delete-orphan",
        order_by="PriorityRecommendation.priority_rank",
    )
