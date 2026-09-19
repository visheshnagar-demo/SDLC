import uuid
import datetime
from sqlalchemy import (
    Column,
    String,
    Float,
    Boolean,
    Integer,
    DateTime,
    ForeignKey,
    Text,
)
from sqlalchemy.orm import relationship
from server.database import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


def get_utc_now() -> datetime.datetime:
    return datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None)


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=generate_uuid)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, default="User Name", nullable=False)
    role = Column(
        String, default="Journalist", nullable=False
    )  # Admin, News Manager, Editor, Journalist, Operator
    is_active = Column(Boolean, default=True, nullable=False)
    is_verified = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=get_utc_now, nullable=False)
    updated_at = Column(
        DateTime,
        default=get_utc_now,
        onupdate=get_utc_now,
        nullable=False,
    )

    transactions = relationship("Transaction", back_populates="user")
    refunds = relationship("Refund", back_populates="actor")
    articles_authored = relationship(
        "Article", foreign_keys="[Article.author_id]", back_populates="author"
    )
    articles_reviewed = relationship(
        "Article", foreign_keys="[Article.reviewer_id]", back_populates="reviewer"
    )
    emergency_overrides = relationship(
        "EmergencyOverride", back_populates="triggered_by"
    )


class Channel(Base):
    __tablename__ = "channels"

    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, unique=True, index=True, nullable=False)
    code = Column(String, unique=True, index=True, nullable=False)
    stream_url = Column(String, nullable=True)
    resolution = Column(String, default="1080p", nullable=False)
    language = Column(String, default="English", nullable=False)
    status = Column(
        String, default="ACTIVE", nullable=False
    )  # ACTIVE, OFF_AIR, MAINTENANCE, EMERGENCY_OVERRIDE
    is_live = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=get_utc_now, nullable=False)
    updated_at = Column(
        DateTime,
        default=get_utc_now,
        onupdate=get_utc_now,
        nullable=False,
    )

    schedules = relationship(
        "Schedule", back_populates="channel", cascade="all, delete-orphan"
    )
    articles = relationship("Article", back_populates="channel")
    emergency_overrides = relationship("EmergencyOverride", back_populates="channel")


class Program(Base):
    __tablename__ = "programs"

    id = Column(String, primary_key=True, default=generate_uuid)
    title = Column(String, index=True, nullable=False)
    category = Column(
        String, nullable=False
    )  # Breaking News, Politics, Sports, Finance, Special
    description = Column(Text, nullable=True)
    default_duration_minutes = Column(Integer, default=60, nullable=False)
    host_name = Column(String, nullable=True)
    is_recurring = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=get_utc_now, nullable=False)
    updated_at = Column(
        DateTime,
        default=get_utc_now,
        onupdate=get_utc_now,
        nullable=False,
    )

    schedules = relationship(
        "Schedule", back_populates="program", cascade="all, delete-orphan"
    )
    articles = relationship("Article", back_populates="program")


class Schedule(Base):
    __tablename__ = "schedules"

    id = Column(String, primary_key=True, default=generate_uuid)
    channel_id = Column(String, ForeignKey("channels.id"), nullable=False)
    program_id = Column(String, ForeignKey("programs.id"), nullable=False)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)
    status = Column(
        String, default="SCHEDULED", nullable=False
    )  # SCHEDULED, LIVE, COMPLETED, CANCELLED, INTERRUPTED
    is_emergency_override = Column(Boolean, default=False, nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=get_utc_now, nullable=False)
    updated_at = Column(
        DateTime,
        default=get_utc_now,
        onupdate=get_utc_now,
        nullable=False,
    )

    channel = relationship("Channel", back_populates="schedules")
    program = relationship("Program", back_populates="schedules")
    emergency_overrides = relationship(
        "EmergencyOverride", back_populates="interrupted_schedule"
    )


class Article(Base):
    __tablename__ = "articles"

    id = Column(String, primary_key=True, default=generate_uuid)
    channel_id = Column(String, ForeignKey("channels.id"), nullable=True)
    program_id = Column(String, ForeignKey("programs.id"), nullable=True)
    author_id = Column(String, ForeignKey("users.id"), nullable=False)
    reviewer_id = Column(String, ForeignKey("users.id"), nullable=True)
    headline = Column(String, nullable=False)
    body = Column(Text, nullable=False)
    summary = Column(Text, nullable=True)
    is_ticker_item = Column(Boolean, default=False, nullable=False)
    priority = Column(
        String, default="NORMAL", nullable=False
    )  # NORMAL, HIGH, URGENT, BREAKING
    status = Column(
        String, default="DRAFT", nullable=False
    )  # DRAFT, IN_REVIEW, APPROVED, PUBLISHED, ARCHIVED
    version = Column(Integer, default=1, nullable=False)
    published_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=get_utc_now, nullable=False)
    updated_at = Column(
        DateTime,
        default=get_utc_now,
        onupdate=get_utc_now,
        nullable=False,
    )

    channel = relationship("Channel", back_populates="articles")
    program = relationship("Program", back_populates="articles")
    author = relationship(
        "User", foreign_keys=[author_id], back_populates="articles_authored"
    )
    reviewer = relationship(
        "User", foreign_keys=[reviewer_id], back_populates="articles_reviewed"
    )


class EmergencyOverride(Base):
    __tablename__ = "emergency_overrides"

    id = Column(String, primary_key=True, default=generate_uuid)
    channel_id = Column(String, ForeignKey("channels.id"), nullable=False)
    triggered_by_id = Column(String, ForeignKey("users.id"), nullable=False)
    interrupted_schedule_id = Column(String, ForeignKey("schedules.id"), nullable=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    started_at = Column(DateTime, default=get_utc_now, nullable=False)
    ended_at = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=get_utc_now, nullable=False)

    channel = relationship("Channel", back_populates="emergency_overrides")
    triggered_by = relationship("User", back_populates="emergency_overrides")
    interrupted_schedule = relationship(
        "Schedule", back_populates="emergency_overrides"
    )


# Existing models kept for compatibility
class CheckoutSession(Base):
    __tablename__ = "checkout_sessions"

    id = Column(String, primary_key=True, default=lambda: f"cs_{uuid.uuid4().hex[:16]}")
    session_id = Column(String, unique=True, index=True, nullable=False)
    payment_intent_id = Column(String, index=True, nullable=False)
    client_secret = Column(String, nullable=False)
    customer_email = Column(String, index=True, nullable=False)
    amount = Column(Float, nullable=False)
    currency = Column(String, nullable=False)
    target_amount = Column(Float, nullable=False)
    target_currency = Column(String, nullable=False)
    exchange_rate = Column(Float, default=1.0, nullable=False)
    items_json = Column(Text, default="[]", nullable=False)
    status = Column(String, default="PENDING", nullable=False)
    created_at = Column(DateTime, default=get_utc_now, nullable=False)


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(String, primary_key=True, default=lambda: f"tx_{uuid.uuid4().hex[:12]}")
    payment_intent_id = Column(String, index=True, nullable=False)
    user_id = Column(String, ForeignKey("users.id"), nullable=True)
    customer_email = Column(String, index=True, nullable=False)
    payment_method = Column(String, default="card", nullable=False)
    amount = Column(Float, nullable=False)
    base_currency = Column(String, default="USD", nullable=False)
    target_currency = Column(String, default="USD", nullable=False)
    converted_amount = Column(Float, nullable=False)
    exchange_rate = Column(Float, default=1.0, nullable=False)
    status = Column(String, default="COMPLETED", nullable=False)
    refunded_amount = Column(Float, default=0.0, nullable=False)
    remaining_refundable_balance = Column(Float, nullable=False)
    created_at = Column(DateTime, default=get_utc_now, nullable=False)
    updated_at = Column(
        DateTime,
        default=get_utc_now,
        onupdate=get_utc_now,
        nullable=False,
    )

    user = relationship("User", back_populates="transactions")
    refunds = relationship(
        "Refund", back_populates="transaction", cascade="all, delete-orphan"
    )
    audit_logs = relationship("AuditLog", back_populates="transaction")


class Refund(Base):
    __tablename__ = "refunds"

    id = Column(
        String, primary_key=True, default=lambda: f"ref_{uuid.uuid4().hex[:12]}"
    )
    transaction_id = Column(String, ForeignKey("transactions.id"), nullable=False)
    actor_id = Column(String, ForeignKey("users.id"), nullable=True)
    refund_amount = Column(Float, nullable=False)
    currency = Column(String, default="USD", nullable=False)
    reason = Column(String, nullable=False)
    memo = Column(String, nullable=True)
    status = Column(String, default="COMPLETED", nullable=False)
    created_at = Column(DateTime, default=get_utc_now, nullable=False)

    transaction = relationship("Transaction", back_populates="refunds")
    actor = relationship("User", back_populates="refunds")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(
        String, primary_key=True, default=lambda: f"log_{uuid.uuid4().hex[:12]}"
    )
    transaction_id = Column(String, ForeignKey("transactions.id"), nullable=True)
    event_type = Column(String, index=True, nullable=False)
    ip_address = Column(String, default="127.0.0.1", nullable=False)
    masked_payload = Column(Text, default="{}", nullable=False)
    created_at = Column(DateTime, default=get_utc_now, nullable=False)

    transaction = relationship("Transaction", back_populates="audit_logs")


class ExchangeRateCache(Base):
    __tablename__ = "exchange_rate_caches"

    id = Column(String, primary_key=True, default=generate_uuid)
    base_currency = Column(String, index=True, nullable=False)
    rates_json = Column(Text, nullable=False)
    fetched_at = Column(DateTime, default=get_utc_now, nullable=False)
    expires_at = Column(DateTime, nullable=False)


class WebhookEvent(Base):
    __tablename__ = "webhook_events"

    id = Column(String, primary_key=True)
    event_type = Column(String, nullable=False)
    processed_at = Column(DateTime, default=get_utc_now, nullable=False)
