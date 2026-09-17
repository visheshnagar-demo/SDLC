import re
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator


class TenantConfigBase(BaseModel):
    custom_domain: Optional[str] = None
    logo_url: Optional[str] = None
    primary_theme_color: Optional[str] = None
    saml_sso_config: Optional[str] = None


class TenantConfigUpdate(TenantConfigBase):
    @field_validator("custom_domain")
    @classmethod
    def validate_custom_domain(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v.strip() != "":
            # Ensure domain format: e.g. portal.acme.com or acme.org (no spaces, protocols)
            domain_pattern = (
                r"^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$"
            )
            if not re.match(domain_pattern, v.strip()):
                raise ValueError(
                    "Invalid custom domain format. Example: portal.acme.com"
                )
        return v.strip() if v else None

    @field_validator("logo_url")
    @classmethod
    def validate_logo_url(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v.strip() != "":
            if not (v.startswith("http://") or v.startswith("https://")):
                raise ValueError("Logo URL must start with http:// or https://")
        return v.strip() if v else None


class TenantConfigResponse(TenantConfigBase):
    id: str
    tenant_id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TenantBase(BaseModel):
    name: str
    slug: str
    admin_email: str
    tier: str = "Free"
    max_users: Optional[int] = None
    storage_limit_gb: Optional[int] = None
    rate_limit_rpm: Optional[int] = None


class TenantCreate(TenantBase):
    @field_validator("slug")
    @classmethod
    def validate_slug(cls, v: str) -> str:
        if not re.match(r"^[a-z0-9-]+$", v):
            raise ValueError(
                "Slug must contain only lowercase letters, numbers, and hyphens"
            )
        return v


class TenantUpdate(BaseModel):
    name: Optional[str] = None
    admin_email: Optional[str] = None
    tier: Optional[str] = None
    max_users: Optional[int] = None
    storage_limit_gb: Optional[int] = None
    rate_limit_rpm: Optional[int] = None


class TenantStatusUpdate(BaseModel):
    status: str = Field(..., description="Active, Suspended, or Archived")
    reason: Optional[str] = None

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str) -> str:
        allowed = {"Active", "Suspended", "Archived"}
        if v not in allowed:
            raise ValueError(f"Status must be one of: {', '.join(allowed)}")
        return v


class TenantStatusResponse(BaseModel):
    id: str
    status: str
    updated_at: datetime
    sessions_revoked: bool

    model_config = ConfigDict(from_attributes=True)


class TenantResponse(TenantBase):
    id: str
    status: str
    max_users: int
    storage_limit_gb: int
    rate_limit_rpm: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TenantDetailResponse(TenantResponse):
    configuration: Optional[TenantConfigResponse] = None

    model_config = ConfigDict(from_attributes=True)


class TenantUserCreate(BaseModel):
    email: str
    password: Optional[str] = "testpassword"
    full_name: Optional[str] = None
    role: str = "tenant_user"


class TenantUserResponse(BaseModel):
    id: str
    tenant_id: str
    email: str
    full_name: Optional[str] = None
    role: str
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
