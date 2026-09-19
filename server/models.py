from datetime import datetime, timezone
import uuid
from sqlalchemy import Column, String, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from server.database import Base


def utc_now():
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    employee_id = Column(String(50), nullable=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    department = Column(String(100), nullable=True)
    role = Column(
        String(50), default="employee", nullable=False
    )  # "admin" or "employee"
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=utc_now, nullable=False)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)

    assignments = relationship(
        "DeviceAssignment", back_populates="user", cascade="all, delete-orphan"
    )


class Device(Base):
    __tablename__ = "devices"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    serial_number = Column(String(100), unique=True, index=True, nullable=False)
    imei = Column(String(100), unique=True, index=True, nullable=True)
    model = Column(String(100), nullable=False)
    manufacturer = Column(String(100), nullable=False)
    os_type = Column(String(50), nullable=False)  # "iOS", "Android", etc.
    os_version = Column(String(50), nullable=False)
    ownership_type = Column(
        String(50), default="Corporate", nullable=False
    )  # "Corporate", "BYOD"
    status = Column(
        String(50), default="Available", nullable=False
    )  # "Available", "Assigned", "Pending Return", "Wiped", "Decommissioned"
    is_encrypted = Column(Boolean, default=False, nullable=False)
    passcode_enforced = Column(Boolean, default=False, nullable=False)
    is_compliant = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=utc_now, nullable=False)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)

    assignments = relationship(
        "DeviceAssignment", back_populates="device", cascade="all, delete-orphan"
    )
    remote_actions = relationship(
        "RemoteAction", back_populates="device", cascade="all, delete-orphan"
    )


class DeviceAssignment(Base):
    __tablename__ = "device_assignments"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    device_id = Column(String(36), ForeignKey("devices.id"), nullable=False)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    assigned_at = Column(DateTime, default=utc_now, nullable=False)
    returned_at = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now, nullable=False)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)

    device = relationship("Device", back_populates="assignments")
    user = relationship("User", back_populates="assignments")


class SecurityPolicy(Base):
    __tablename__ = "security_policies"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    min_os_version_ios = Column(String(50), default="16.0", nullable=False)
    min_os_version_android = Column(String(50), default="12.0", nullable=False)
    require_encryption = Column(Boolean, default=True, nullable=False)
    require_passcode = Column(Boolean, default=True, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=utc_now, nullable=False)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)


class RemoteAction(Base):
    __tablename__ = "remote_actions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    device_id = Column(String(36), ForeignKey("devices.id"), nullable=False)
    initiated_by_user_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    action_type = Column(
        String(50), nullable=False
    )  # "Remote Lock", "Remote Wipe", "Status Check"
    status = Column(
        String(50), default="Completed", nullable=False
    )  # "Pending", "Completed", "Failed"
    reason = Column(Text, nullable=True)
    executed_at = Column(DateTime, default=utc_now, nullable=False)
    created_at = Column(DateTime, default=utc_now, nullable=False)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)

    device = relationship("Device", back_populates="remote_actions")
    initiated_by = relationship("User")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    actor_id = Column(String(36), nullable=True)
    action = Column(String(100), nullable=False)
    resource_type = Column(String(100), nullable=False)
    resource_id = Column(String(255), nullable=False)
    details = Column(Text, nullable=True)  # JSON formatted string
    created_at = Column(DateTime, default=utc_now, nullable=False)
