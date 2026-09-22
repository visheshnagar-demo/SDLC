"""SQLAlchemy Database Models."""

import uuid
from datetime import datetime
from typing import Optional, List
from sqlalchemy import (
    String,
    Boolean,
    DateTime,
    Float,
    Integer,
    Text,
    ForeignKey,
    func,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


def generate_uuid() -> str:
    return str(uuid.uuid4())


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    email: Mapped[str] = mapped_column(
        String(255), unique=True, index=True, nullable=False
    )
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(
        String(50), nullable=False, default="READ_ONLY"
    )  # 'ADMIN' or 'READ_ONLY'
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=func.now(), onupdate=func.now(), nullable=False
    )

    audit_logs: Mapped[List["AuditLog"]] = relationship(
        "AuditLog", back_populates="user", cascade="all, delete-orphan"
    )


class CloudProvider(Base):
    __tablename__ = "cloud_providers"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    provider_type: Mapped[str] = mapped_column(
        String(50), nullable=False
    )  # 'AWS', 'GCP', 'AZURE'
    encrypted_credentials: Mapped[str] = mapped_column(Text, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=func.now(), onupdate=func.now(), nullable=False
    )

    instances: Mapped[List["CloudInstance"]] = relationship(
        "CloudInstance", back_populates="provider", cascade="all, delete-orphan"
    )


class CloudInstance(Base):
    __tablename__ = "cloud_instances"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    provider_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("cloud_providers.id", ondelete="CASCADE"), nullable=False
    )
    external_instance_id: Mapped[str] = mapped_column(String(255), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    region: Mapped[str] = mapped_column(String(100), nullable=False)
    instance_type: Mapped[str] = mapped_column(String(100), nullable=False)
    status: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="PROVISIONING",
    )  # 'PENDING', 'PROVISIONING', 'RUNNING', 'STOPPING', 'STOPPED', 'RESTARTING', 'TERMINATING', 'TERMINATED', 'ERROR'
    public_ip: Mapped[Optional[str]] = mapped_column(String(45), nullable=True)
    private_ip: Mapped[Optional[str]] = mapped_column(String(45), nullable=True)
    launch_time: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), default=func.now(), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=func.now(), onupdate=func.now(), nullable=False
    )

    provider: Mapped["CloudProvider"] = relationship(
        "CloudProvider", back_populates="instances"
    )
    metrics: Mapped[List["InstanceMetric"]] = relationship(
        "InstanceMetric", back_populates="instance", cascade="all, delete-orphan"
    )


class InstanceMetric(Base):
    __tablename__ = "instance_metrics"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    instance_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("cloud_instances.id", ondelete="CASCADE"), nullable=False
    )
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=func.now(), nullable=False, index=True
    )
    cpu_utilization_pct: Mapped[float] = mapped_column(Float, nullable=False)
    memory_utilization_pct: Mapped[float] = mapped_column(Float, nullable=False)
    disk_read_bytes_sec: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    network_in_bytes_sec: Mapped[int] = mapped_column(
        Integer, default=0, nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=func.now(), nullable=False
    )

    instance: Mapped["CloudInstance"] = relationship(
        "CloudInstance", back_populates="metrics"
    )


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    user_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    user_email: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    action: Mapped[str] = mapped_column(String(100), nullable=False)
    target_resource: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[str] = mapped_column(
        String(50), nullable=False
    )  # 'SUCCESS', 'FAILED', 'DENIED'
    details: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    ip_address: Mapped[Optional[str]] = mapped_column(String(45), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=func.now(), nullable=False, index=True
    )

    user: Mapped[Optional["User"]] = relationship("User", back_populates="audit_logs")
