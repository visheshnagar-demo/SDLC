from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, EmailStr, ConfigDict


# Auth Schemas
class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    user_id: Optional[str] = None
    role: Optional[str] = None


# User Schemas
class UserBase(BaseModel):
    employee_id: Optional[str] = None
    email: EmailStr
    full_name: str
    department: Optional[str] = None
    role: str = "employee"
    is_active: bool = True


class UserCreate(UserBase):
    password: str


class UserUpdate(BaseModel):
    employee_id: Optional[str] = None
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    department: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None


class UserResponse(UserBase):
    id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# Device Schemas
class DeviceBase(BaseModel):
    serial_number: str
    imei: Optional[str] = None
    model: str
    manufacturer: str
    os_type: str
    os_version: str
    ownership_type: str = "Corporate"
    status: str = "Available"
    is_encrypted: bool = False
    passcode_enforced: bool = False
    is_compliant: bool = True


class DeviceCreate(DeviceBase):
    pass


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


class DeviceResponse(DeviceBase):
    id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# Assignment Schemas
class DeviceAssignRequest(BaseModel):
    user_id: str
    notes: Optional[str] = None


class DeviceUnassignRequest(BaseModel):
    notes: Optional[str] = None


class DeviceAssignmentResponse(BaseModel):
    id: str
    device_id: str
    user_id: str
    assigned_at: datetime
    returned_at: Optional[datetime] = None
    notes: Optional[str] = None
    user: Optional[UserResponse] = None

    model_config = ConfigDict(from_attributes=True)


# Security Policy Schemas
class SecurityPolicyBase(BaseModel):
    name: str
    description: Optional[str] = None
    min_os_version_ios: str = "16.0"
    min_os_version_android: str = "12.0"
    require_encryption: bool = True
    require_passcode: bool = True
    is_active: bool = True


class SecurityPolicyCreate(SecurityPolicyBase):
    pass


class SecurityPolicyUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    min_os_version_ios: Optional[str] = None
    min_os_version_android: Optional[str] = None
    require_encryption: Optional[bool] = None
    require_passcode: Optional[bool] = None
    is_active: Optional[bool] = None


class SecurityPolicyResponse(SecurityPolicyBase):
    id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# Remote Action Schemas
class RemoteActionCreate(BaseModel):
    action_type: str  # "Remote Lock", "Remote Wipe", "Status Check"
    reason: Optional[str] = None


class RemoteActionResponse(BaseModel):
    id: str
    device_id: str
    initiated_by_user_id: Optional[str] = None
    action_type: str
    status: str
    reason: Optional[str] = None
    executed_at: datetime

    model_config = ConfigDict(from_attributes=True)


# Analytics Dashboard Schema
class DashboardAnalyticsResponse(BaseModel):
    total_devices: int
    active_assignments: int
    available_devices: int
    non_compliant_count: int
    os_distribution: Dict[str, int]


# Audit Log Schema
class AuditLogResponse(BaseModel):
    id: str
    actor_id: Optional[str] = None
    action: str
    resource_type: str
    resource_id: str
    details: Optional[Any] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
