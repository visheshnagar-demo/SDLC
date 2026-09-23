import uuid
from sqlalchemy import Column, String, Text, Float, Boolean, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from server.database import Base


class Email(Base):
    __tablename__ = "emails"

    id = Column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True
    )
    subject = Column(String(255), nullable=True)
    body = Column(Text, nullable=False)
    preview = Column(String(255), nullable=True)
    file_name = Column(String(255), nullable=True)
    file_type = Column(String(50), nullable=True)
    category = Column(String(50), nullable=False)
    original_category = Column(String(50), nullable=False)
    confidence_score = Column(Float, nullable=False, default=0.0)
    status = Column(String(50), nullable=False, default="PROCESSED")
    is_overridden = Column(Boolean, nullable=False, default=False)
    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    audit_logs = relationship(
        "ClassificationAuditLog", back_populates="email", cascade="all, delete-orphan"
    )


class ClassificationAuditLog(Base):
    __tablename__ = "classification_audit_logs"

    id = Column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True
    )
    email_id = Column(String(36), ForeignKey("emails.id"), nullable=False, index=True)
    previous_category = Column(String(50), nullable=False)
    new_category = Column(String(50), nullable=False)
    reason = Column(String(255), nullable=True)
    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    email = relationship("Email", back_populates="audit_logs")
