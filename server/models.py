import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column,
    String,
    Boolean,
    Float,
    Integer,
    Date,
    DateTime,
    ForeignKey,
    Text,
)
from sqlalchemy.orm import relationship
from server.database import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


def get_utc_now() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, index=True, nullable=False)
    full_name = Column(String(255), nullable=True)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(50), default="user", nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    is_verified = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=get_utc_now, nullable=False)
    updated_at = Column(
        DateTime, default=get_utc_now, onupdate=get_utc_now, nullable=False
    )

    products = relationship(
        "Product", back_populates="user", cascade="all, delete-orphan"
    )


class Product(Base):
    __tablename__ = "products"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name = Column(String(255), nullable=False)
    brand = Column(String(255), nullable=False)
    category = Column(String(100), nullable=False, index=True)
    purchase_date = Column(Date, nullable=False)
    serial_number = Column(String(255), nullable=True, index=True)
    purchase_price = Column(Float, nullable=False, default=0.0)
    vendor = Column(String(255), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=get_utc_now, nullable=False)
    updated_at = Column(
        DateTime, default=get_utc_now, onupdate=get_utc_now, nullable=False
    )

    user = relationship("User", back_populates="products")
    warranties = relationship(
        "Warranty", back_populates="product", cascade="all, delete-orphan"
    )
    documents = relationship(
        "Document", back_populates="product", cascade="all, delete-orphan"
    )
    claims = relationship(
        "Claim", back_populates="product", cascade="all, delete-orphan"
    )


class Warranty(Base):
    __tablename__ = "warranties"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    product_id = Column(
        String(36),
        ForeignKey("products.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    coverage_duration_months = Column(Integer, nullable=False, default=12)
    start_date = Column(Date, nullable=False)
    expiration_date = Column(Date, nullable=True)
    coverage_type = Column(String(100), nullable=False, default="Standard")
    provider_name = Column(String(255), nullable=True)
    status = Column(
        String(50), nullable=False, default="Active"
    )  # Active, Expired, Lifetime, Void
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=get_utc_now, nullable=False)
    updated_at = Column(
        DateTime, default=get_utc_now, onupdate=get_utc_now, nullable=False
    )

    product = relationship("Product", back_populates="warranties")


class Document(Base):
    __tablename__ = "documents"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    product_id = Column(
        String(36),
        ForeignKey("products.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    filename = Column(String(255), nullable=False)
    file_size = Column(Integer, nullable=False)
    mime_type = Column(String(100), nullable=False)
    document_type = Column(
        String(100), nullable=False, default="receipt"
    )  # receipt, warranty_card, invoice, other
    file_path = Column(String(500), nullable=False)
    created_at = Column(DateTime, default=get_utc_now, nullable=False)
    updated_at = Column(
        DateTime, default=get_utc_now, onupdate=get_utc_now, nullable=False
    )

    product = relationship("Product", back_populates="documents")


class Claim(Base):
    __tablename__ = "claims"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    product_id = Column(
        String(36),
        ForeignKey("products.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    claim_date = Column(Date, nullable=False)
    issue_description = Column(Text, nullable=False)
    status = Column(
        String(50), nullable=False, default="Pending"
    )  # Pending, In Progress, Approved, Resolved, Rejected
    service_center = Column(String(255), nullable=True)
    repair_cost = Column(Float, nullable=False, default=0.0)
    resolution_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=get_utc_now, nullable=False)
    updated_at = Column(
        DateTime, default=get_utc_now, onupdate=get_utc_now, nullable=False
    )

    product = relationship("Product", back_populates="claims")
