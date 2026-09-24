import uuid
import datetime
from sqlalchemy import (
    Column,
    String,
    Float,
    Integer,
    Boolean,
    DateTime,
    ForeignKey,
    Text,
    JSON,
)
from sqlalchemy.orm import relationship
from server.database import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


def get_utc_now() -> datetime.datetime:
    return datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None)


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(50), default="analyst", nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    is_verified = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=get_utc_now, nullable=False)
    updated_at = Column(
        DateTime,
        default=get_utc_now,
        onupdate=get_utc_now,
        nullable=False,
    )


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    account_id = Column(String(64), index=True, nullable=False)
    amount = Column(Float, nullable=False)
    currency = Column(String(3), default="USD", nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    location_name = Column(String(128), nullable=True)
    merchant = Column(String(128), nullable=True)
    timestamp = Column(DateTime, default=get_utc_now, index=True, nullable=False)
    created_at = Column(DateTime, default=get_utc_now, nullable=False)

    alerts = relationship(
        "Alert",
        back_populates="transaction",
        cascade="all, delete-orphan",
    )


class Rule(Base):
    __tablename__ = "rules"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(100), nullable=False)
    rule_type = Column(
        String(50), nullable=False
    )  # AMOUNT_THRESHOLD, FREQUENCY_VELOCITY, GEOGRAPHIC_VELOCITY
    description = Column(Text, nullable=True)
    parameters = Column(JSON, default=dict, nullable=False)
    severity = Column(
        String(20), default="HIGH", nullable=False
    )  # LOW, MEDIUM, HIGH, CRITICAL
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=get_utc_now, nullable=False)
    updated_at = Column(
        DateTime,
        default=get_utc_now,
        onupdate=get_utc_now,
        nullable=False,
    )

    violations = relationship("AlertViolation", back_populates="rule")


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    transaction_id = Column(String(36), ForeignKey("transactions.id"), nullable=False)
    account_id = Column(String(64), index=True, nullable=False)
    severity = Column(
        String(20), default="HIGH", index=True, nullable=False
    )  # LOW, MEDIUM, HIGH, CRITICAL
    risk_score = Column(Integer, default=50, nullable=False)
    status = Column(
        String(30), default="NEW", index=True, nullable=False
    )  # NEW, UNDER_REVIEW, ESCALATED, CONFIRMED_FRAUD, DISMISSED
    notes = Column(Text, nullable=True)
    assigned_to = Column(String(128), nullable=True)
    created_at = Column(DateTime, default=get_utc_now, index=True, nullable=False)
    updated_at = Column(
        DateTime,
        default=get_utc_now,
        onupdate=get_utc_now,
        nullable=False,
    )

    transaction = relationship("Transaction", back_populates="alerts")
    violations = relationship(
        "AlertViolation",
        back_populates="alert",
        cascade="all, delete-orphan",
    )


class AlertViolation(Base):
    __tablename__ = "alert_violations"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    alert_id = Column(String(36), ForeignKey("alerts.id"), nullable=False)
    rule_id = Column(String(36), ForeignKey("rules.id"), nullable=False)
    rule_name = Column(String(100), nullable=False)
    violation_details = Column(JSON, default=dict, nullable=False)
    created_at = Column(DateTime, default=get_utc_now, nullable=False)

    alert = relationship("Alert", back_populates="violations")
    rule = relationship("Rule", back_populates="violations")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    entity_type = Column(
        String(50), index=True, nullable=False
    )  # RULE, ALERT, TRANSACTION
    entity_id = Column(String(64), index=True, nullable=False)
    action = Column(
        String(50), nullable=False
    )  # CREATE, UPDATE, STATUS_CHANGE, TOGGLE_ACTIVE
    actor = Column(String(128), default="system", nullable=False)
    changes = Column(JSON, default=dict, nullable=False)
    created_at = Column(DateTime, default=get_utc_now, index=True, nullable=False)
