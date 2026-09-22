"""SQLAlchemy database models for Cloud Management System."""

import uuid
from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, String, Text, func
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False, default="read_only")
    is_active = Column(Boolean, default=True, nullable=False)
    is_verified = Column(Boolean, default=True, nullable=False)
    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    audit_logs = relationship("AuditLog", back_populates="user")


class CloudProvider(Base):
    __tablename__ = "cloud_providers"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(100), nullable=False)
    provider_type = Column(String(50), nullable=False)  # AWS, GCP, AZURE
    is_active = Column(Boolean, default=True, nullable=False)
    account_id = Column(String(100), nullable=True)
    region = Column(String(100), nullable=True)
    credentials_encrypted = Column(Text, nullable=True)
    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    instances = relationship(
        "CloudInstance", back_populates="provider", cascade="all, delete-orphan"
    )


class CloudInstance(Base):
    __tablename__ = "cloud_instances"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    external_instance_id = Column(String(100), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    provider_id = Column(
        String(36), ForeignKey("cloud_providers.id", ondelete="CASCADE"), nullable=False
    )
    region = Column(String(100), nullable=False)
    instance_type = Column(String(100), nullable=False)
    status = Column(String(50), nullable=False, default="RUNNING")
    public_ip = Column(String(100), nullable=True)
    private_ip = Column(String(100), nullable=True)
    image_id = Column(String(100), nullable=True)
    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    provider = relationship("CloudProvider", back_populates="instances")
    metrics = relationship(
        "InstanceMetrics", back_populates="instance", cascade="all, delete-orphan"
    )


class InstanceMetrics(Base):
    __tablename__ = "instance_metrics"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    instance_id = Column(
        String(36), ForeignKey("cloud_instances.id", ondelete="CASCADE"), nullable=False
    )
    cpu_utilization_pct = Column(Float, nullable=False)
    memory_utilization_pct = Column(Float, nullable=False)
    disk_read_bytes_sec = Column(Float, nullable=False, default=0.0)
    network_in_bytes_sec = Column(Float, nullable=False, default=0.0)
    timestamp = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    instance = relationship("CloudInstance", back_populates="metrics")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(
        String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    user_email = Column(String(255), nullable=False)
    action = Column(String(100), nullable=False)
    target_resource = Column(String(255), nullable=False)
    status = Column(String(50), nullable=False, default="SUCCESS")
    ip_address = Column(String(100), nullable=True)
    details = Column(Text, nullable=True)
    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    user = relationship("User", back_populates="audit_logs")
