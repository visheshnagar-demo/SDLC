import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from server.database import Base


class Email(Base):
    __tablename__ = "emails"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    subject = Column(String(500), nullable=True)
    body = Column(Text, nullable=False)
    preview = Column(String(500), nullable=True)
    file_name = Column(String(255), nullable=True)
    file_type = Column(String(50), nullable=True)
    category = Column(String(50), nullable=False, default="Uncategorized")
    original_category = Column(String(50), nullable=True)
    confidence_score = Column(Float, nullable=False, default=0.0)
    status = Column(String(50), nullable=False, default="PENDING")
    is_overridden = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )


class ClassificationAuditLog(Base):
    __tablename__ = "classification_audit_logs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email_id = Column(String(36), ForeignKey("emails.id"), nullable=False)
    previous_category = Column(String(50), nullable=True)
    new_category = Column(String(50), nullable=False)
    action = Column(String(100), nullable=False)
    reason = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    email = relationship(
        Email,
        back_populates="audit_logs",
    )


Email.audit_logs = relationship(
    ClassificationAuditLog,
    back_populates="email",
    cascade="all, delete-orphan",
    order_by=ClassificationAuditLog.created_at.desc(),
)
