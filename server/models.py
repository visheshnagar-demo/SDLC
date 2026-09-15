import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Index, String, Text
from sqlalchemy.orm import relationship

from server.database import Base


def get_utc_now():
    return datetime.now(timezone.utc)


class Email(Base):
    __tablename__ = "emails"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    sender = Column(String(255), nullable=True, index=True)
    subject = Column(String(500), nullable=True, index=True)
    body_text = Column(Text, nullable=False)
    source_type = Column(
        String(50), nullable=False, default="TEXT_ENTRY"
    )  # TEXT_ENTRY or FILE_UPLOAD
    file_name = Column(String(255), nullable=True)
    created_at = Column(
        DateTime(timezone=True), default=get_utc_now, nullable=False, index=True
    )
    updated_at = Column(
        DateTime(timezone=True),
        default=get_utc_now,
        onupdate=get_utc_now,
        nullable=False,
    )

    classification = relationship(
        "Classification",
        back_populates="email",
        uselist=False,
        cascade="all, delete-orphan",
        passive_deletes=True,
    )


class Classification(Base):
    __tablename__ = "classifications"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email_id = Column(
        String(36),
        ForeignKey("emails.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )
    ai_category = Column(
        String(50), nullable=False, index=True
    )  # Work, Personal, Urgent, Promotional
    confidence_score = Column(Float, nullable=False)
    user_override_category = Column(String(50), nullable=True, index=True)
    is_overridden = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), default=get_utc_now, nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        default=get_utc_now,
        onupdate=get_utc_now,
        nullable=False,
    )

    email = relationship("Email", back_populates="classification")


Index(
    "idx_classifications_categories",
    Classification.ai_category,
    Classification.user_override_category,
)
