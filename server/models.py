import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column,
    String,
    Boolean,
    Float,
    Integer,
    Text,
    DateTime,
    ForeignKey,
)
from sqlalchemy.orm import relationship as rel
from server.database import Base


def generate_uuid():
    return str(uuid.uuid4())


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(50), default="devotee")  # admin, priest, cashier, devotee
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    devotee = rel("Devotee", back_populates="user", uselist=False)


class Devotee(Base):
    __tablename__ = "devotees"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    devotee_number = Column(String(50), unique=True, nullable=False, index=True)
    phone = Column(String(50), nullable=True, index=True)
    address = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = rel("User", back_populates="devotee")
    family_members = rel(
        "FamilyMember", back_populates="devotee", cascade="all, delete-orphan"
    )
    bookings = rel("PoojaBooking", back_populates="devotee")
    donations = rel("Donation", back_populates="devotee")


class FamilyMember(Base):
    __tablename__ = "family_members"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    devotee_id = Column(String(36), ForeignKey("devotees.id"), nullable=False)
    full_name = Column(String(255), nullable=False)
    relationship = Column(String(50), nullable=True)
    gotra = Column(String(50), nullable=True)
    rashi = Column(String(50), nullable=True)
    nakshatra = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    devotee = rel("Devotee", back_populates="family_members")


class PoojaCatalog(Base):
    __tablename__ = "pooja_catalog"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    code = Column(String(50), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    default_price = Column(Float, nullable=False, default=0.0)
    duration_minutes = Column(Integer, default=30)
    max_capacity = Column(Integer, default=50)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    slots = rel("PoojaSlot", back_populates="pooja")


class PoojaSlot(Base):
    __tablename__ = "pooja_slots"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    pooja_id = Column(String(36), ForeignKey("pooja_catalog.id"), nullable=False)
    priest_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    slot_date = Column(String(10), nullable=False)  # YYYY-MM-DD
    start_time = Column(String(8), nullable=False)  # HH:MM
    end_time = Column(String(8), nullable=False)  # HH:MM
    capacity = Column(Integer, default=50)
    booked_count = Column(Integer, default=0)
    status = Column(String(50), default="open")  # open, full, cancelled
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    pooja = rel("PoojaCatalog", back_populates="slots")
    priest = rel("User")
    bookings = rel("PoojaBooking", back_populates="slot")


class PoojaBooking(Base):
    __tablename__ = "pooja_bookings"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    slot_id = Column(String(36), ForeignKey("pooja_slots.id"), nullable=False)
    devotee_id = Column(String(36), ForeignKey("devotees.id"), nullable=True)
    booking_number = Column(String(50), unique=True, nullable=False, index=True)
    sankalp_name = Column(String(255), nullable=False)
    sankalp_gotra = Column(String(50), nullable=True)
    amount_paid = Column(Float, nullable=False, default=0.0)
    payment_status = Column(String(50), default="completed")
    qr_code_token = Column(String(255), unique=True, nullable=False)
    booking_status = Column(
        String(50), default="confirmed"
    )  # confirmed, used, cancelled
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    slot = rel("PoojaSlot", back_populates="bookings")
    devotee = rel("Devotee", back_populates="bookings")


class Donation(Base):
    __tablename__ = "donations"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    devotee_id = Column(String(36), ForeignKey("devotees.id"), nullable=True)
    receipt_number = Column(String(50), unique=True, nullable=False, index=True)
    fund_type = Column(String(50), nullable=False)  # annadanam, corpus, general_hundi
    amount = Column(Float, nullable=False)
    payment_method = Column(String(50), default="upi")  # upi, cash, card
    payment_ref = Column(String(100), nullable=True)
    is_tax_exempt = Column(Boolean, default=True)
    tax_80g_ref = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    devotee = rel("Devotee", back_populates="donations")


class CashierShift(Base):
    __tablename__ = "cashier_shifts"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    cashier_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    counter_number = Column(String(50), nullable=False, default="Counter-1")
    opened_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    closed_at = Column(DateTime, nullable=True)
    opening_cash = Column(Float, default=0.0)
    closing_cash_actual = Column(Float, nullable=True)
    system_calculated = Column(Float, default=0.0)
    variance = Column(Float, default=0.0)
    status = Column(String(50), default="open")  # open, closed
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    cashier = rel("User")


class InventoryItem(Base):
    __tablename__ = "inventory_items"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    item_code = Column(String(50), unique=True, nullable=False, index=True)
    item_name = Column(String(255), nullable=False)
    category = Column(
        String(50), nullable=False
    )  # prasadam, pooja_item, precious_asset
    unit_of_measure = Column(String(50), default="kg")
    current_stock = Column(Float, default=0.0)
    minimum_threshold = Column(Float, default=10.0)
    is_precious_asset = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    movements = rel("InventoryMovement", back_populates="item")


class InventoryMovement(Base):
    __tablename__ = "inventory_movements"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    item_id = Column(String(36), ForeignKey("inventory_items.id"), nullable=False)
    movement_type = Column(String(50), nullable=False)  # in, out, audit
    quantity = Column(Float, nullable=False)
    unit_price = Column(Float, default=0.0)
    reference_reason = Column(String(255), nullable=True)
    performed_by = Column(String(36), ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    item = rel("InventoryItem", back_populates="movements")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    action = Column(String(100), nullable=False)
    user_id = Column(String(36), nullable=True)
    details = Column(Text, nullable=True)
    ip_address = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
