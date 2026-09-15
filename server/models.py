import uuid
from datetime import datetime, timezone

from sqlalchemy import JSON, Boolean, Column, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=True)
    full_name = Column(String(255), nullable=False)
    department = Column(String(100), nullable=True)
    role = Column(
        String(50), nullable=False, default="HOST"
    )  # 'HOST', 'RECEPTIONIST', 'ADMIN'
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
    updated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    visits = relationship("Visit", back_populates="host")
    audit_logs = relationship("VisitAuditLog", back_populates="actor")


class Visitor(Base):
    __tablename__ = "visitors"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    full_name = Column(String(255), nullable=False)
    email = Column(String(255), index=True, nullable=False)
    phone = Column(String(50), nullable=False)
    company = Column(String(255), nullable=True)
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
    updated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    visits = relationship(
        "Visit", back_populates="visitor", cascade="all, delete-orphan"
    )


class Visit(Base):
    __tablename__ = "visits"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    visitor_id = Column(
        String(36),
        ForeignKey("visitors.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    host_id = Column(
        String(36),
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    purpose = Column(Text, nullable=False)
    scheduled_start_time = Column(DateTime(timezone=True), nullable=False, index=True)
    scheduled_end_time = Column(DateTime(timezone=True), nullable=True)
    status = Column(
        String(50),
        nullable=False,
        default="PENDING_APPROVAL",
        index=True,
    )  # 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELLED'
    pass_code = Column(String(32), unique=True, index=True, nullable=True)
    approval_notes = Column(Text, nullable=True)
    approved_at = Column(DateTime(timezone=True), nullable=True)
    check_in_time = Column(DateTime(timezone=True), nullable=True)
    check_out_time = Column(DateTime(timezone=True), nullable=True)
    badge_id = Column(String(100), nullable=True)
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
    updated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    visitor = relationship("Visitor", back_populates="visits")
    host = relationship("User", back_populates="visits")
    audit_logs = relationship(
        "VisitAuditLog", back_populates="visit", cascade="all, delete-orphan"
    )


class VisitAuditLog(Base):
    __tablename__ = "visit_audit_logs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    visit_id = Column(
        String(36),
        ForeignKey("visits.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    actor_id = Column(
        String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    actor_role = Column(
        String(50), nullable=False
    )  # 'VISITOR', 'HOST', 'RECEPTIONIST', 'ADMIN', 'SYSTEM'
    action = Column(
        String(100), nullable=False
    )  # 'REGISTERED', 'APPROVED', 'REJECTED', 'CHECKED_IN', 'CHECKED_OUT'
    details = Column(JSON, nullable=True)
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    visit = relationship("Visit", back_populates="audit_logs")
    actor = relationship("User", back_populates="audit_logs")
