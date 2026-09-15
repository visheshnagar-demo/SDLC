from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime


class TenantOnboardRequest(BaseModel):
    name: str = Field(..., example="Acme Corporation")
    slug: str = Field(..., example="acme-corp")
    domain: Optional[str] = Field(None, example="acme.com")
    admin_email: EmailStr = Field(..., example="admin@acme.com")
    admin_full_name: str = Field(..., example="Acme Admin")
    admin_password: str = Field(..., example="SecurePassword123!")


class TenantOnboardResponse(BaseModel):
    id: str
    name: str
    slug: str
    domain: Optional[str] = None
    status: str
    admin_user_id: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TenantResponse(BaseModel):
    id: str
    name: str
    slug: str
    domain: Optional[str] = None
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TenantListResponse(BaseModel):
    items: List[TenantResponse]
    total: int
    skip: int
    limit: int


class TenantStatusUpdate(BaseModel):
    status: str = Field(..., example="Suspended")  # Active, Suspended, Deactivated


class TenantUserInvite(BaseModel):
    email: EmailStr
    full_name: Optional[str] = "Tenant User"
    role: str = Field(
        "User", example="Tenant Admin"
    )  # Tenant Owner, Tenant Admin, User, Viewer


class TenantUserResponse(BaseModel):
    id: str
    tenant_id: str
    user_id: str
    email: str
    full_name: str
    role: str
    status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TenantUserListResponse(BaseModel):
    items: List[TenantUserResponse]
    total: int
    skip: int
    limit: int


class TenantConfigUpdate(BaseModel):
    rate_limit_rpm: Optional[int] = Field(1000, ge=1)
    storage_quota_gb: Optional[int] = Field(50, ge=0)
    feature_flags: Optional[Dict[str, Any]] = Field(default_factory=dict)


class TenantConfigResponse(BaseModel):
    id: str
    tenant_id: str
    rate_limit_rpm: int
    storage_quota_gb: int
    feature_flags: Dict[str, Any]
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AuditLogResponse(BaseModel):
    id: str
    tenant_id: str
    actor_id: Optional[str] = None
    action: str
    entity_type: str
    entity_id: Optional[str] = None
    details: Dict[str, Any] = Field(default_factory=dict)
    ip_address: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AuditLogListResponse(BaseModel):
    items: List[AuditLogResponse]
    total: int
    skip: int
    limit: int


class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    is_active: bool
    is_verified: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
