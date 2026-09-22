import json
import uuid
from sqlalchemy import (
    Column,
    String,
    Integer,
    Float,
    Boolean,
    DateTime,
    ForeignKey,
    Text,
    func,
)
from sqlalchemy.orm import relationship

from server.database import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(50), default="customer", nullable=False)  # "customer", "admin"
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime, server_default=func.now(), onupdate=func.now(), nullable=False
    )

    addresses = relationship(
        "UserAddress", back_populates="user", cascade="all, delete-orphan"
    )
    orders = relationship("Order", back_populates="user")
    cart_items = relationship(
        "CartItem", back_populates="user", cascade="all, delete-orphan"
    )
    wishlist_items = relationship(
        "WishlistItem", back_populates="user", cascade="all, delete-orphan"
    )
    reserved_watches = relationship(
        "Watch",
        back_populates="reserved_by_user",
        foreign_keys="Watch.reserved_by_user_id",
    )


class UserAddress(Base):
    __tablename__ = "user_addresses"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    user_id = Column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    street_address = Column(String(255), nullable=False)
    city = Column(String(100), nullable=False)
    state = Column(String(100), nullable=False)
    postal_code = Column(String(50), nullable=False)
    country = Column(String(100), default="United States", nullable=False)
    is_default = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    user = relationship("User", back_populates="addresses")


class Watch(Base):
    __tablename__ = "watches"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    brand = Column(String(100), index=True, nullable=False)
    model = Column(String(150), index=True, nullable=False)
    reference_number = Column(String(100), index=True, nullable=False)
    serial_number = Column(String(100), unique=True, index=True, nullable=False)
    year_of_manufacture = Column(Integer, nullable=False)
    condition_score = Column(Float, nullable=False)  # e.g. 9.8
    condition_grade = Column(String(50), nullable=False)  # Mint, Near Mint, etc.
    price = Column(Float, index=True, nullable=False)
    movement_type = Column(String(50), nullable=False)  # Automatic, Manual, Quartz
    case_size_mm = Column(Float, nullable=False)  # e.g. 41.0
    dial_color = Column(String(50), nullable=False)
    bezel_material = Column(String(100), nullable=False)
    strap_material = Column(String(100), nullable=False)
    box_included = Column(Boolean, default=True, nullable=False)
    papers_included = Column(Boolean, default=True, nullable=False)
    authentication_status = Column(
        String(50), default="VERIFIED", nullable=False
    )  # VERIFIED, PENDING_VERIFICATION
    certificate_number = Column(
        String(100), unique=True, nullable=False
    )  # e.g. CERT-99281
    authenticator_notes = Column(Text, nullable=True)
    _image_urls = Column("image_urls", Text, nullable=False, default="[]")
    status = Column(
        String(50), default="AVAILABLE", index=True, nullable=False
    )  # AVAILABLE, RESERVED, SOLD
    reserved_by_user_id = Column(
        String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    hold_expires_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime, server_default=func.now(), onupdate=func.now(), nullable=False
    )

    reserved_by_user = relationship(
        "User", back_populates="reserved_watches", foreign_keys=[reserved_by_user_id]
    )
    orders = relationship("Order", back_populates="watch")
    cart_items = relationship(
        "CartItem", back_populates="watch", cascade="all, delete-orphan"
    )
    wishlist_items = relationship(
        "WishlistItem", back_populates="watch", cascade="all, delete-orphan"
    )

    @property
    def image_urls(self):
        try:
            return json.loads(self._image_urls) if self._image_urls else []
        except Exception:
            return []

    @image_urls.setter
    def image_urls(self, value):
        if isinstance(value, list):
            self._image_urls = json.dumps(value)
        elif isinstance(value, str):
            self._image_urls = value
        else:
            self._image_urls = "[]"


class CartItem(Base):
    __tablename__ = "cart_items"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    user_id = Column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    watch_id = Column(
        String(36), ForeignKey("watches.id", ondelete="CASCADE"), nullable=False
    )
    reserved_at = Column(DateTime, server_default=func.now(), nullable=False)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    user = relationship("User", back_populates="cart_items")
    watch = relationship("Watch", back_populates="cart_items")


class Order(Base):
    __tablename__ = "orders"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    order_number = Column(String(100), unique=True, index=True, nullable=False)
    user_id = Column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    watch_id = Column(
        String(36), ForeignKey("watches.id", ondelete="RESTRICT"), nullable=False
    )
    total_amount = Column(Float, nullable=False)
    shipping_fee = Column(Float, default=0.0, nullable=False)
    shipping_tier = Column(String(100), nullable=False)
    shipping_address_id = Column(
        String(36), ForeignKey("user_addresses.id", ondelete="SET NULL"), nullable=True
    )
    payment_status = Column(
        String(50), default="PAID", nullable=False
    )  # PENDING, PAID, FAILED, REFUNDED
    fulfillment_status = Column(
        String(50), default="PENDING_VERIFICATION", nullable=False
    )
    # PENDING_VERIFICATION, PACKAGING, COURIER_DISPATCH, OUT_FOR_DELIVERY, DELIVERED, CANCELLED
    tracking_number = Column(String(100), nullable=True)
    courier_name = Column(String(100), nullable=True)
    handover_pin = Column(String(20), nullable=True)
    certificate_url = Column(String(255), nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime, server_default=func.now(), onupdate=func.now(), nullable=False
    )

    user = relationship("User", back_populates="orders")
    watch = relationship("Watch", back_populates="orders")
    shipping_address = relationship("UserAddress")


class WishlistItem(Base):
    __tablename__ = "wishlist_items"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    user_id = Column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    watch_id = Column(
        String(36), ForeignKey("watches.id", ondelete="CASCADE"), nullable=False
    )
    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    user = relationship("User", back_populates="wishlist_items")
    watch = relationship("Watch", back_populates="wishlist_items")
