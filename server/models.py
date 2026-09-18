import uuid
from sqlalchemy import Column, String, Boolean, Text, DateTime, ForeignKey, JSON, func
from sqlalchemy.orm import relationship
from server.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    employee_id = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    full_name = Column(String(255), nullable=False)
    department = Column(String(100), nullable=False)
    role = Column(
        String(50), default="EMPLOYEE", nullable=False
    )  # ADMIN, IT_SUPPORT, EMPLOYEE
    is_active = Column(Boolean, default=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    assignments = relationship("DeviceAssignment", back_populates="user")
    remote_actions = relationship("RemoteAction", back_populates="initiated_by_user")
    audit_logs = relationship("AuditLog", back_populates="actor")


class Device(Base):
    __tablename__ = "devices"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    serial_number = Column(String(100), unique=True, nullable=False, index=True)
    imei = Column(String(30), unique=True, nullable=False, index=True)
    model = Column(String(100), nullable=False)
    manufacturer = Column(String(100), nullable=False)
    os_type = Column(String(50), nullable=False)  # iOS, Android
    os_version = Column(String(50), nullable=False)
    ownership_type = Column(
        String(30), default="CORPORATE", nullable=False
    )  # CORPORATE, BYOD
    status = Column(
        String(30), default="AVAILABLE", nullable=False
    )  # AVAILABLE, ASSIGNED, PENDING_RETURN, WIPED, DECOMMISSIONED
    is_encrypted = Column(Boolean, default=True, nullable=False)
    passcode_enforced = Column(Boolean, default=True, nullable=False)
    is_compliant = Column(Boolean, default=True, nullable=False)
    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    assignments = relationship("DeviceAssignment", back_populates="device")
    remote_actions = relationship("RemoteAction", back_populates="remote_device")


class DeviceAssignment(Base):
    __tablename__ = "device_assignments"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    device_id = Column(String(36), ForeignKey("devices.id"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    assigned_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    returned_at = Column(DateTime(timezone=True), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    device = relationship("Device", back_populates="assignments")
    user = relationship("User", back_populates="assignments")


class SecurityPolicy(Base):
    __tablename__ = "security_policies"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(150), nullable=False)
    description = Column(Text, nullable=True)
    min_os_version_ios = Column(String(50), default="16.0", nullable=False)
    min_os_version_android = Column(String(50), default="13.0", nullable=False)
    require_encryption = Column(Boolean, default=True, nullable=False)
    require_passcode = Column(Boolean, default=True, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


class RemoteAction(Base):
    __tablename__ = "remote_actions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    device_id = Column(String(36), ForeignKey("devices.id"), nullable=False, index=True)
    initiated_by_user_id = Column(
        String(36), ForeignKey("users.id"), nullable=False, index=True
    )
    action_type = Column(
        String(50), nullable=False
    )  # REMOTE_LOCK, REMOTE_WIPE, STATUS_CHECK
    status = Column(
        String(30), default="PENDING", nullable=False
    )  # PENDING, EXECUTED, FAILED
    reason = Column(Text, nullable=True)
    executed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    remote_device = relationship("Device", back_populates="remote_actions")
    initiated_by_user = relationship("User", back_populates="remote_actions")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    actor_id = Column(String(36), ForeignKey("users.id"), nullable=True, index=True)
    action = Column(String(100), nullable=False)
    resource_type = Column(String(100), nullable=False)
    resource_id = Column(String(100), nullable=False)
    details = Column(JSON, nullable=True)
    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    actor = relationship("User", back_populates="audit_logs")
