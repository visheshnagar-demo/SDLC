import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Boolean, Text, DateTime, func
from sqlalchemy.orm import relationship
from server.core.database import Base


class Track(Base):
    __tablename__ = "tracks"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String(255), nullable=False)
    slug = Column(String(255), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=False)
    difficulty = Column(String(50), nullable=False, default="Beginner")
    estimated_hours = Column(Integer, nullable=False, default=10)
    prerequisites = Column(String(255), nullable=True, default="")
    order_index = Column(Integer, nullable=False, default=0)
    is_published = Column(Boolean, nullable=False, default=True)
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

    modules = relationship(
        "Module",
        back_populates="track",
        cascade="all, delete-orphan",
        order_by="Module.order_index",
    )
