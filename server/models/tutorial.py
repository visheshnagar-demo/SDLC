import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Text, ForeignKey, DateTime, JSON, func
from sqlalchemy.orm import relationship
from server.core.database import Base


class Tutorial(Base):
    __tablename__ = "tutorials"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    module_id = Column(String(36), ForeignKey("modules.id"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    slug = Column(String(255), unique=True, nullable=False, index=True)
    content_markdown = Column(Text, nullable=False)
    math_formulas = Column(Text, nullable=True)
    code_snippets = Column(JSON, nullable=True, default=list)
    tags = Column(String(255), nullable=True, default="")
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

    module = relationship("Module", back_populates="tutorials")
    bookmarks = relationship(
        "Bookmark", back_populates="tutorial", cascade="all, delete-orphan"
    )
