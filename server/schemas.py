from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, EmailStr


# Auth Schemas
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class LoginRequest(BaseModel):
    email: str
    password: str


class UserOut(BaseModel):
    id: str
    email: str
    full_name: Optional[str] = None
    employee_id: Optional[str] = None
    department: Optional[str] = None
    role: str
    is_active: bool
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: Optional[str] = None
    employee_id: Optional[str] = None
    department: Optional[str] = None
    role: str = "user"


# Device Schemas
class DeviceCreate(BaseModel):
    serial_number: str
    imei: Optional[str] = None
    model: str
    manufacturer: str
    os_type: str
    os_version: str
    ownership_type: str = "Corporate"
    is_encrypted: bool = True
    passcode_enforced: bool = True


class DeviceUpdate(BaseModel):
    serial_number: Optional[str] = None
    imei: Optional[str] = None
    model: Optional[str] = None
    manufacturer: Optional[str] = None
    os_type: Optional[str] = None
    os_version: Optional[str] = None
    ownership_type: Optional[str] = None
    status: Optional[str] = None
    is_encrypted: Optional[bool] = None
    passcode_enforced: Optional[bool] = None
    is_compliant: Optional[bool] = None


class DeviceOut(BaseModel):
    id: str
    serial_number: str
    imei: Optional[str] = None
    model: str
    manufacturer: str
    os_type: str
    os_version: str
    ownership_type: str
    status: str
    is_encrypted: bool
    passcode_enforced: bool
    is_compliant: bool
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class DeviceAssignRequest(BaseModel):
    user_id: str
    notes: Optional[str] = None


class DeviceUnassignRequest(BaseModel):
    notes: Optional[str] = None


class AssignmentOut(BaseModel):
    id: str
    device_id: str
    user_id: str
    assigned_at: Optional[datetime] = None
    returned_at: Optional[datetime] = None
    notes: Optional[str] = None
    user: Optional[UserOut] = None

    class Config:
        from_attributes = True


# Policy Schemas
class PolicyCreate(BaseModel):
    name: str
    description: Optional[str] = None
    min_os_version_ios: str = "15.0"
    min_os_version_android: str = "11.0"
    require_encryption: bool = True
    require_passcode: bool = True
    is_active: bool = True


class PolicyUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    min_os_version_ios: Optional[str] = None
    min_os_version_android: Optional[str] = None
    require_encryption: Optional[bool] = None
    require_passcode: Optional[bool] = None
    is_active: Optional[bool] = None


class PolicyOut(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    min_os_version_ios: str
    min_os_version_android: str
    require_encryption: bool
    require_passcode: bool
    is_active: bool
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Remote Action Schemas
class RemoteActionCreate(BaseModel):
    action_type: str  # "Remote Lock", "Remote Wipe", "Device Status Check"
    reason: Optional[str] = None


class RemoteActionOut(BaseModel):
    id: str
    device_id: str
    initiated_by_user_id: Optional[str] = None
    action_type: str
    status: str
    reason: Optional[str] = None
    executed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Analytics Schemas
class DashboardMetrics(BaseModel):
    total_devices: int
    active_assignments: int
    available_devices: int
    unassigned_inventory: int
    non_compliant_count: int
    os_distribution: Dict[str, int]
    status_distribution: Dict[str, int]
    ownership_distribution: Dict[str, int]


# Audit Schemas
class AuditLogOut(BaseModel):
    id: str
    actor_id: Optional[str] = None
    action: str
    resource_type: str
    resource_id: Optional[str] = None
    details: Optional[Any] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
