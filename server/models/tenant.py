import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from server.database import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class Tenant(Base):
    __tablename__ = "tenants"

    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, nullable=False)
    slug = Column(String, unique=True, index=True, nullable=False)
    status = Column(
        String, nullable=False, default="Active"
    )  # Active, Suspended, Archived
    tier = Column(String, nullable=False, default="Free")  # Free, Pro, Enterprise
    admin_email = Column(String, nullable=False)
    max_users = Column(Integer, nullable=False, default=10)
    storage_limit_gb = Column(Integer, nullable=False, default=5)
    rate_limit_rpm = Column(Integer, nullable=False, default=100)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    configuration = relationship(
        "TenantConfiguration",
        uselist=False,
        back_populates="tenant",
        cascade="all, delete-orphan",
    )
    users = relationship(
        "TenantUser",
        back_populates="tenant",
        cascade="all, delete-orphan",
    )


class TenantConfiguration(Base):
    __tablename__ = "tenant_configurations"

    id = Column(String, primary_key=True, default=generate_uuid)
    tenant_id = Column(
        String,
        ForeignKey("tenants.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
    )
    custom_domain = Column(String, unique=True, nullable=True)
    logo_url = Column(String, nullable=True)
    primary_theme_color = Column(String, nullable=True, default="#4F46E5")
    saml_sso_config = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    tenant = relationship("Tenant", back_populates="configuration")


class TenantUser(Base):
    __tablename__ = "tenant_users"

    id = Column(String, primary_key=True, default=generate_uuid)
    tenant_id = Column(
        String,
        ForeignKey("tenants.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    email = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    role = Column(
        String, nullable=False, default="user"
    )  # system_admin, tenant_admin, user
    is_active = Column(Boolean, nullable=False, default=True)
    is_verified = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    tenant = relationship("Tenant", back_populates="users")
