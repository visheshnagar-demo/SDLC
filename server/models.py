"""SQLAlchemy database models for Garba Management System."""
import uuid
from datetime import datetime
from sqlalchemy import (
    Column,
    String,
    Float,
    Integer,
    Boolean,
    Text,
    DateTime,
    ForeignKey,
    Date,
)
from sqlalchemy.orm import relationship
from server.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(150), nullable=False)
    phone = Column(String(30), nullable=True)
    role = Column(String(50), nullable=False, default="ATTENDEE")  # ATTENDEE, GATE_SECURITY, EVENT_ADMIN
    is_active = Column(Boolean, nullable=False, default=True)
    is_verified = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    bookings = relationship("Booking", back_populates="user", cascade="all, delete-orphan")
    scans = relationship("GateCheckin", back_populates="scanned_by_user")


class Event(Base):
    __tablename__ = "events"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    venue_name = Column(String(200), nullable=False)
    start_date = Column(String(50), nullable=False)
    end_date = Column(String(50), nullable=False)
    status = Column(String(50), nullable=False, default="ACTIVE")  # DRAFT, ACTIVE, COMPLETED, CANCELLED
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    pass_tiers = relationship("PassTier", back_populates="event", cascade="all, delete-orphan")
    bookings = relationship("Booking", back_populates="event", cascade="all, delete-orphan")


class PassTier(Base):
    __tablename__ = "pass_tiers"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    event_id = Column(String(36), ForeignKey("events.id"), nullable=False, index=True)
    tier_name = Column(String(100), nullable=False)  # Single-Day Pass, Season Pass, VIP Pass
    description = Column(String(255), nullable=True)
    price = Column(Float, nullable=False)
    total_quota = Column(Integer, nullable=False)
    available_quota = Column(Integer, nullable=False)
    valid_from = Column(String(50), nullable=False)
    valid_to = Column(String(50), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    event = relationship("Event", back_populates="pass_tiers")
    passes = relationship("Pass", back_populates="pass_tier")


class Booking(Base):
    __tablename__ = "bookings"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    booking_reference = Column(String(50), unique=True, index=True, nullable=False)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    event_id = Column(String(36), ForeignKey("events.id"), nullable=False, index=True)
    total_amount = Column(Float, nullable=False)
    booking_status = Column(String(50), nullable=False, default="CONFIRMED")  # PENDING, CONFIRMED, CANCELLED
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="bookings")
    event = relationship("Event", back_populates="bookings")
    passes = relationship("Pass", back_populates="booking", cascade="all, delete-orphan")


class Pass(Base):
    __tablename__ = "passes"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    pass_number = Column(String(50), unique=True, index=True, nullable=False)
    booking_id = Column(String(36), ForeignKey("bookings.id"), nullable=False, index=True)
    pass_tier_id = Column(String(36), ForeignKey("pass_tiers.id"), nullable=False, index=True)
    attendee_name = Column(String(150), nullable=False)
    attendee_email = Column(String(255), nullable=True)
    attendee_phone = Column(String(30), nullable=True)
    qr_signature_hash = Column(String(255), nullable=False, index=True)
    qr_payload = Column(Text, nullable=False)
    status = Column(String(50), nullable=False, default="ACTIVE")  # ACTIVE, USED, REVOKED
    entry_count = Column(Integer, nullable=False, default=0)
    max_entries = Column(Integer, nullable=False, default=1)
    last_scanned_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    booking = relationship("Booking", back_populates="passes")
    pass_tier = relationship("PassTier", back_populates="passes")
    checkins = relationship("GateCheckin", back_populates="pass_rel", cascade="all, delete-orphan")


class GateCheckin(Base):
    __tablename__ = "gate_checkins"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    pass_id = Column(String(36), ForeignKey("passes.id"), nullable=False, index=True)
    gate_identifier = Column(String(100), nullable=False)
    scanned_by_user_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    scan_result = Column(String(50), nullable=False)  # SUCCESS, DUPLICATE_BLOCKED, EXPIRED, INVALID_SIGNATURE
    scan_timestamp = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    notes = Column(String(255), nullable=True)

    pass_rel = relationship("Pass", back_populates="checkins")
    scanned_by_user = relationship("User", back_populates="scans")
