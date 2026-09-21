import uuid
import datetime
from sqlalchemy import (
    Column,
    String,
    Float,
    Boolean,
    DateTime,
    Date,
    Integer,
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
    role = Column(String, default="user", nullable=False)
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


# --- Hens Management System Models ---

class Flock(Base):
    __tablename__ = "flocks"

    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, nullable=False)
    breed = Column(String, nullable=False)
    hatch_date = Column(Date, nullable=False)
    initial_count = Column(Integer, nullable=False)
    active_count = Column(Integer, nullable=False)
    coop_location = Column(String, nullable=False)
    status = Column(String, default="ACTIVE", nullable=False)
    created_at = Column(DateTime, default=get_utc_now, nullable=False)
    updated_at = Column(
        DateTime,
        default=get_utc_now,
        onupdate=get_utc_now,
        nullable=False,
    )

    egg_collections = relationship("EggCollection", back_populates="flock", cascade="all, delete-orphan")
    feed_logs = relationship("FeedLog", back_populates="flock", cascade="all, delete-orphan")
    health_logs = relationship("HealthMortalityLog", back_populates="flock", cascade="all, delete-orphan")


class EggCollection(Base):
    __tablename__ = "egg_collections"

    id = Column(String, primary_key=True, default=generate_uuid)
    flock_id = Column(String, ForeignKey("flocks.id"), nullable=False)
    collection_date = Column(Date, nullable=False)
    session = Column(String, nullable=False)
    grade_large = Column(Integer, default=0, nullable=False)
    grade_medium = Column(Integer, default=0, nullable=False)
    grade_small = Column(Integer, default=0, nullable=False)
    damaged = Column(Integer, default=0, nullable=False)
    total_count = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=get_utc_now, nullable=False)

    flock = relationship("Flock", back_populates="egg_collections")


class FeedInventory(Base):
    __tablename__ = "feed_inventory"

    id = Column(String, primary_key=True, default=generate_uuid)
    feed_type = Column(String, unique=True, nullable=False)
    quantity_kg = Column(Float, default=0.0, nullable=False)
    reorder_threshold_kg = Column(Float, default=100.0, nullable=False)
    created_at = Column(DateTime, default=get_utc_now, nullable=False)
    updated_at = Column(
        DateTime,
        default=get_utc_now,
        onupdate=get_utc_now,
        nullable=False,
    )

    logs = relationship("FeedLog", back_populates="feed", cascade="all, delete-orphan")


class FeedLog(Base):
    __tablename__ = "feed_logs"

    id = Column(String, primary_key=True, default=generate_uuid)
    flock_id = Column(String, ForeignKey("flocks.id"), nullable=False)
    feed_id = Column(String, ForeignKey("feed_inventory.id"), nullable=False)
    quantity_used_kg = Column(Float, nullable=False)
    log_date = Column(Date, nullable=False)
    created_at = Column(DateTime, default=get_utc_now, nullable=False)

    flock = relationship("Flock", back_populates="feed_logs")
    feed = relationship("FeedInventory", back_populates="logs")


class HealthMortalityLog(Base):
    __tablename__ = "health_mortality_logs"

    id = Column(String, primary_key=True, default=generate_uuid)
    flock_id = Column(String, ForeignKey("flocks.id"), nullable=False)
    log_date = Column(Date, nullable=False)
    log_type = Column(String, nullable=False)
    quantity = Column(Integer, default=1, nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=get_utc_now, nullable=False)

    flock = relationship("Flock", back_populates="health_logs")
