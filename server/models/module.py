import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Text, ForeignKey, DateTime, func
from sqlalchemy.orm import relationship
from server.core.database import Base


class Module(Base):
    __tablename__ = "modules"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    track_id = Column(String(36), ForeignKey("tracks.id"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    slug = Column(String(255), unique=True, nullable=False, index=True)
    summary = Column(Text, nullable=False)
    difficulty = Column(String(50), nullable=False, default="Beginner")
    estimated_minutes = Column(Integer, nullable=False, default=45)
    prerequisites = Column(String(255), nullable=True, default="")
    order_index = Column(Integer, nullable=False, default=0)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        server_default=func.now(),
        nullable=False,
    )
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        server_default=func.now(),
        nullable=False,
    )

    track = relationship("Track", back_populates="modules")
    tutorials = relationship(
        "Tutorial",
        back_populates="module",
        cascade="all, delete-orphan",
        order_by="Tutorial.order_index",
    )
    quiz = relationship(
        "Quiz", back_populates="module", uselist=False, cascade="all, delete-orphan"
    )
    progress_records = relationship(
        "UserProgress", back_populates="module", cascade="all, delete-orphan"
    )
