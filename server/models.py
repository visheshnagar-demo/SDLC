import sys
import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Boolean, JSON, DateTime, ForeignKey
from sqlalchemy.orm import relationship

if __name__ == "server.models":
    sys.modules["models"] = sys.modules["server.models"]
elif __name__ == "models":
    sys.modules["server.models"] = sys.modules["models"]

from server.database import Base


def utc_now():
    return datetime.now(timezone.utc)


class SubscriptionTier(Base):
    __tablename__ = "subscription_tiers"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(64), unique=True, nullable=False, index=True)
    display_name = Column(String(128), nullable=False)
    max_users = Column(Integer, nullable=False, default=10)
    max_storage_gb = Column(Integer, nullable=False, default=5)
    feature_flags = Column(JSON, nullable=False, default=dict)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=utc_now)
    updated_at = Column(
        DateTime(timezone=True), nullable=False, default=utc_now, onupdate=utc_now
    )

    tenants = relationship("Tenant", back_populates="tier")


class Tenant(Base):
    __tablename__ = "tenants"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String(64), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    slug = Column(String(64), unique=True, nullable=False, index=True)
    status = Column(
        String(32), nullable=False, default="ACTIVE"
    )  # ACTIVE, SUSPENDED, CANCELLED, SOFT_DELETED
    tier_id = Column(String(36), ForeignKey("subscription_tiers.id"), nullable=False)
    admin_email = Column(String(255), nullable=True)
    admin_first_name = Column(String(128), nullable=True)
    admin_last_name = Column(String(128), nullable=True)
    custom_subdomain = Column(String(255), nullable=True)
    settings = Column(JSON, nullable=False, default=dict)
    active_users_count = Column(Integer, nullable=False, default=1)
    storage_used_gb = Column(Integer, nullable=False, default=0)
    is_deleted = Column(Boolean, nullable=False, default=False)
    deleted_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=utc_now)
    updated_at = Column(
        DateTime(timezone=True), nullable=False, default=utc_now, onupdate=utc_now
    )

    tier = relationship("SubscriptionTier", back_populates="tenants")
    domains = relationship(
        "TenantDomain", back_populates="tenant", cascade="all, delete-orphan"
    )
    quotas = relationship(
        "TenantQuota",
        back_populates="tenant",
        uselist=False,
        cascade="all, delete-orphan",
    )
    audit_logs = relationship(
        "TenantAuditLog", back_populates="tenant", cascade="all, delete-orphan"
    )


class TenantDomain(Base):
    __tablename__ = "tenant_domains"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(
        String(36), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False
    )
    domain_name = Column(String(255), unique=True, nullable=False, index=True)
    is_primary = Column(Boolean, nullable=False, default=False)
    is_verified = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=utc_now)
    updated_at = Column(
        DateTime(timezone=True), nullable=False, default=utc_now, onupdate=utc_now
    )

    tenant = relationship("Tenant", back_populates="domains")


class TenantQuota(Base):
    __tablename__ = "tenant_quotas"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(
        String(36),
        ForeignKey("tenants.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
    )
    custom_max_users = Column(Integer, nullable=True)
    custom_max_storage_gb = Column(Integer, nullable=True)
    custom_feature_flags = Column(JSON, nullable=False, default=dict)
    created_at = Column(DateTime(timezone=True), nullable=False, default=utc_now)
    updated_at = Column(
        DateTime(timezone=True), nullable=False, default=utc_now, onupdate=utc_now
    )

    tenant = relationship("Tenant", back_populates="quotas")


class TenantAuditLog(Base):
    __tablename__ = "tenant_audit_logs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(
        String(36), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False
    )
    actor_id = Column(String(128), nullable=False, default="system_admin")
    action = Column(String(64), nullable=False)
    details = Column(JSON, nullable=False, default=dict)
    ip_address = Column(String(45), nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=utc_now)

    tenant = relationship("Tenant", back_populates="audit_logs")
