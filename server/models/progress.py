import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column,
    String,
    Integer,
    Boolean,
    ForeignKey,
    DateTime,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import relationship
from server.core.database import Base


class UserProgress(Base):
    __tablename__ = "user_progress"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    module_id = Column(String(36), ForeignKey("modules.id"), nullable=False, index=True)
    is_completed = Column(Boolean, nullable=False, default=False)
    quiz_score = Column(Integer, nullable=True)
    last_accessed_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        server_default=func.now(),
        nullable=False,
    )

    __table_args__ = (
        UniqueConstraint("user_id", "module_id", name="uq_user_module_progress"),
    )

    user = relationship("User", back_populates="progress_records")
    module = relationship("Module", back_populates="progress_records")
