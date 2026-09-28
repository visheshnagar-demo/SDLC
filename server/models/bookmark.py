import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, ForeignKey, DateTime, UniqueConstraint, func
from sqlalchemy.orm import relationship
from server.core.database import Base


class Bookmark(Base):
    __tablename__ = "bookmarks"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    tutorial_id = Column(
        String(36), ForeignKey("tutorials.id"), nullable=False, index=True
    )
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        server_default=func.now(),
        nullable=False,
    )

    __table_args__ = (
        UniqueConstraint("user_id", "tutorial_id", name="uq_user_tutorial_bookmark"),
    )

    user = relationship("User", back_populates="bookmarks")
    tutorial = relationship("Tutorial", back_populates="bookmarks")
