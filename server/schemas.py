from datetime import datetime
from typing import Optional, Any, Dict
from pydantic import BaseModel, EmailStr, ConfigDict


# --- Auth Schemas ---
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    user_id: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


# --- User Schemas ---
class UserBase(BaseModel):
    employee_id: str
    email: EmailStr
    full_name: str
    department: str
    role: str = "EMPLOYEE"
    is_active: bool = True


class UserCreate(UserBase):
    password: str


class UserRead(UserBase):
    id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# --- Device Schemas ---
class DeviceBase(BaseModel):
    serial_number: str
    imei: str
    model: str
    manufacturer: str
    os_type: str  # iOS, Android
    os_version: str
    ownership_type: str = "CORPORATE"  # CORPORATE, BYOD
    status: str = (
        "AVAILABLE"  # AVAILABLE, ASSIGNED, PENDING_RETURN, WIPED, DECOMMISSIONED
    )
    is_encrypted: bool = True
    passcode_enforced: bool = True
    is_compliant: bool = True


class DeviceCreate(DeviceBase):
    pass


class DeviceUpdate(BaseModel):
    model: Optional[str] = None
    manufacturer: Optional[str] = None
    os_type: Optional[str] = None
    os_version: Optional[str] = None
    ownership_type: Optional[str] = None
    status: Optional[str] = None
    is_encrypted: Optional[bool] = None
    passcode_enforced: Optional[bool] = None
    is_compliant: Optional[bool] = None


class DeviceAssign(BaseModel):
    user_id: str
    notes: Optional[str] = None


class DeviceUnassign(BaseModel):
    status_after_unassign: Optional[str] = "AVAILABLE"  # AVAILABLE, PENDING_RETURN
    notes: Optional[str] = None


class DeviceRead(DeviceBase):
    id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# --- Device Assignment Schemas ---
class DeviceAssignmentRead(BaseModel):
    id: str
    device_id: str
    user_id: str
    assigned_at: datetime
    returned_at: Optional[datetime] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# --- Security Policy Schemas ---
class SecurityPolicyBase(BaseModel):
    name: str
    description: Optional[str] = None
    min_os_version_ios: str = "16.0"
    min_os_version_android: str = "13.0"
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


class SecurityPolicyRead(SecurityPolicyBase):
    id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# --- Remote Action Schemas ---
class RemoteActionCreate(BaseModel):
    action_type: str  # REMOTE_LOCK, REMOTE_WIPE, STATUS_CHECK
    reason: Optional[str] = None


class RemoteActionRead(BaseModel):
    id: str
    device_id: str
    initiated_by_user_id: str
    action_type: str
    status: str
    reason: Optional[str] = None
    executed_at: Optional[datetime] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# --- Audit Log Schemas ---
class AuditLogRead(BaseModel):
    id: str
    actor_id: Optional[str] = None
    action: str
    resource_type: str
    resource_id: str
    details: Optional[Dict[str, Any]] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# --- Analytics Dashboard Schema ---
class DashboardAnalytics(BaseModel):
    total_devices: int
    active_assignments: int
    available_devices: int
    non_compliant_count: int
    os_distribution: Dict[str, int]
    status_distribution: Dict[str, int]
