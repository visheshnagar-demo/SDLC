import uuid
import datetime
import json
from sqlalchemy import (
    Column,
    String,
    Float,
    Integer,
    Boolean,
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
    role = Column(String, default="staff", nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    is_verified = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=get_utc_now, nullable=False)
    updated_at = Column(
        DateTime,
        default=get_utc_now,
        onupdate=get_utc_now,
        nullable=False,
    )


class Room(Base):
    __tablename__ = "rooms"

    id = Column(String, primary_key=True, default=generate_uuid)
    room_number = Column(String(20), unique=True, index=True, nullable=False)
    room_category = Column(String(50), nullable=False)  # Standard, Deluxe, Suite
    base_rate_per_night = Column(Float, nullable=False)
    status = Column(
        String(50), default="Available", nullable=False
    )  # Available, Occupied, Under Maintenance, Reserved
    floor_number = Column(Integer, nullable=False, default=1)
    max_occupancy = Column(Integer, nullable=False, default=2)
    amenities = Column(Text, default="[]", nullable=False)
    created_at = Column(DateTime, default=get_utc_now, nullable=False)
    updated_at = Column(
        DateTime,
        default=get_utc_now,
        onupdate=get_utc_now,
        nullable=False,
    )

    bookings = relationship("Booking", back_populates="room")

    def get_amenities_list(self) -> list[str]:
        if not self.amenities:
            return []
        try:
            return json.loads(self.amenities)
        except Exception:
            return [a.strip() for a in self.amenities.split(",") if a.strip()]

    def set_amenities_list(self, items: list[str]):
        self.amenities = json.dumps(items)


class Guest(Base):
    __tablename__ = "guests"

    id = Column(String, primary_key=True, default=generate_uuid)
    full_name = Column(String(150), nullable=False, index=True)
    email = Column(String(150), nullable=False, index=True)
    phone_number = Column(String(50), nullable=False)
    id_proof_type = Column(String(50), nullable=False)  # Passport, Driver License, etc.
    id_proof_number = Column(String(100), nullable=False)
    address = Column(Text, nullable=True)
    vip_status = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=get_utc_now, nullable=False)
    updated_at = Column(
        DateTime,
        default=get_utc_now,
        onupdate=get_utc_now,
        nullable=False,
    )

    bookings = relationship("Booking", back_populates="guest")
    invoices = relationship("Invoice", back_populates="guest")


class Booking(Base):
    __tablename__ = "bookings"

    id = Column(String, primary_key=True, default=generate_uuid)
    booking_reference = Column(String(30), unique=True, index=True, nullable=False)
    room_id = Column(String, ForeignKey("rooms.id"), nullable=False, index=True)
    guest_id = Column(String, ForeignKey("guests.id"), nullable=False, index=True)
    check_in_date = Column(String(10), nullable=False)  # YYYY-MM-DD
    check_out_date = Column(String(10), nullable=False)  # YYYY-MM-DD
    total_nights = Column(Integer, nullable=False)
    total_amount = Column(Float, nullable=False)
    booking_status = Column(
        String(50), default="Reserved", nullable=False
    )  # Reserved, Confirmed, CheckedIn, CheckedOut, Cancelled
    actual_check_in = Column(DateTime, nullable=True)
    actual_check_out = Column(DateTime, nullable=True)
    special_requests = Column(Text, nullable=True)
    created_at = Column(DateTime, default=get_utc_now, nullable=False)
    updated_at = Column(
        DateTime,
        default=get_utc_now,
        onupdate=get_utc_now,
        nullable=False,
    )

    room = relationship("Room", back_populates="bookings")
    guest = relationship("Guest", back_populates="bookings")
    invoice = relationship(
        "Invoice", back_populates="booking", uselist=False, cascade="all, delete-orphan"
    )


class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(String, primary_key=True, default=generate_uuid)
    invoice_number = Column(String(30), unique=True, index=True, nullable=False)
    booking_id = Column(String, ForeignKey("bookings.id"), nullable=False, index=True)
    guest_id = Column(String, ForeignKey("guests.id"), nullable=False, index=True)
    room_charges = Column(Float, default=0.0, nullable=False)
    service_charges = Column(Float, default=0.0, nullable=False)
    tax_amount = Column(Float, default=0.0, nullable=False)
    total_payable = Column(Float, default=0.0, nullable=False)
    payment_status = Column(
        String(50), default="Pending", nullable=False
    )  # Pending, Paid, Refunded
    payment_method = Column(
        String(50), nullable=True
    )  # CreditCard, DebitCard, Cash, etc.
    paid_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=get_utc_now, nullable=False)
    updated_at = Column(
        DateTime,
        default=get_utc_now,
        onupdate=get_utc_now,
        nullable=False,
    )

    booking = relationship("Booking", back_populates="invoice")
    guest = relationship("Guest", back_populates="invoices")
    items = relationship(
        "InvoiceItem", back_populates="invoice", cascade="all, delete-orphan"
    )


class InvoiceItem(Base):
    __tablename__ = "invoice_items"

    id = Column(String, primary_key=True, default=generate_uuid)
    invoice_id = Column(String, ForeignKey("invoices.id"), nullable=False, index=True)
    description = Column(String(255), nullable=False)
    item_type = Column(
        String(50), default="Service", nullable=False
    )  # RoomFee, Service, Amenity, Dining, Spa
    unit_price = Column(Float, nullable=False)
    quantity = Column(Integer, default=1, nullable=False)
    total_price = Column(Float, nullable=False)
    created_at = Column(DateTime, default=get_utc_now, nullable=False)

    invoice = relationship("Invoice", back_populates="items")
