import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from server.database import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=True)
    employee_id = Column(String(100), nullable=True)
    department = Column(String(100), nullable=True)
    role = Column(String(50), default="user", nullable=False)  # admin or user
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=utc_now)

    assignments = relationship("DeviceAssignment", back_populates="user")
    remote_actions = relationship("RemoteAction", back_populates="initiated_by_user")
    audit_logs = relationship("AuditLog", back_populates="actor")


class Device(Base):
    __tablename__ = "devices"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    serial_number = Column(String(100), unique=True, index=True, nullable=False)
    imei = Column(String(100), unique=True, index=True, nullable=True)
    model = Column(String(100), nullable=False)
    manufacturer = Column(String(100), nullable=False)
    os_type = Column(String(50), nullable=False)  # iOS, Android
    os_version = Column(String(50), nullable=False)
    ownership_type = Column(
        String(50), default="Corporate", nullable=False
    )  # Corporate, BYOD
    status = Column(
        String(50), default="Available", nullable=False
    )  # Available, Assigned, Pending Return, Wiped, Decommissioned
    is_encrypted = Column(Boolean, default=True, nullable=False)
    passcode_enforced = Column(Boolean, default=True, nullable=False)
    is_compliant = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    assignments = relationship(
        "DeviceAssignment", back_populates="device", cascade="all, delete-orphan"
    )
    remote_actions = relationship(
        "RemoteAction", back_populates="device", cascade="all, delete-orphan"
    )


class DeviceAssignment(Base):
    __tablename__ = "device_assignments"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    device_id = Column(String(36), ForeignKey("devices.id"), nullable=False)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    assigned_at = Column(DateTime, default=utc_now)
    returned_at = Column(DateTime, nullable=True)
    notes = Column(String(500), nullable=True)

    device = relationship("Device", back_populates="assignments")
    user = relationship("User", back_populates="assignments")


class SecurityPolicy(Base):
    __tablename__ = "security_policies"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False)
    description = Column(String(500), nullable=True)
    min_os_version_ios = Column(String(50), default="15.0", nullable=False)
    min_os_version_android = Column(String(50), default="11.0", nullable=False)
    require_encryption = Column(Boolean, default=True, nullable=False)
    require_passcode = Column(Boolean, default=True, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)


class RemoteAction(Base):
    __tablename__ = "remote_actions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    device_id = Column(String(36), ForeignKey("devices.id"), nullable=False)
    initiated_by_user_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    action_type = Column(
        String(50), nullable=False
    )  # Remote Lock, Remote Wipe, Device Status Check
    status = Column(
        String(50), default="Completed", nullable=False
    )  # Pending, Executing, Completed, Failed
    reason = Column(String(500), nullable=True)
    executed_at = Column(DateTime, default=utc_now)

    device = relationship("Device", back_populates="remote_actions")
    initiated_by_user = relationship("User", back_populates="remote_actions")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    actor_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    action = Column(String(100), nullable=False)
    resource_type = Column(String(100), nullable=False)
    resource_id = Column(String(100), nullable=True)
    details_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now)

    actor = relationship("User", back_populates="audit_logs")
