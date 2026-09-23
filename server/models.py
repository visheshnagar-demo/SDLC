import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, Float, Boolean, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from server.database import Base


class Email(Base):
    __tablename__ = "emails"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    subject = Column(String(500), nullable=True)
    body = Column(Text, nullable=False)
    preview = Column(String(255), nullable=False)
    file_name = Column(String(255), nullable=True)
    file_type = Column(String(50), nullable=True)
    category = Column(String(50), nullable=False)
    original_category = Column(String(50), nullable=False)
    confidence_score = Column(Float, nullable=False, default=0.0)
    status = Column(String(50), nullable=False, default="PENDING")
    is_overridden = Column(Boolean, nullable=False, default=False)
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=datetime.utcnow,
        server_default=func.now(),
    )
    updated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        server_default=func.now(),
    )

    audit_logs = relationship(
        lambda: ClassificationAuditLog,
        back_populates="email",
        cascade="all, delete-orphan",
    )


class ClassificationAuditLog(Base):
    __tablename__ = "classification_audit_logs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email_id = Column(
        String(36), ForeignKey("emails.id", ondelete="CASCADE"), nullable=False
    )
    previous_category = Column(String(50), nullable=False)
    new_category = Column(String(50), nullable=False)
    modified_by = Column(String(255), nullable=True, default="user")
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=datetime.utcnow,
        server_default=func.now(),
    )

    email = relationship(lambda: Email, back_populates="audit_logs")
