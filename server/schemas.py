import sys
from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, ConfigDict, Field

if __name__ == "server.schemas":
    sys.modules["schemas"] = sys.modules["server.schemas"]
elif __name__ == "schemas":
    sys.modules["server.schemas"] = sys.modules["schemas"]


class TenantCreateRequest(BaseModel):
    name: str = Field(..., description="Organization or Tenant Name")
    slug: str = Field(..., description="Unique URL slug or subdomain handle")
    tier_id: Optional[str] = Field(None, description="Subscription tier UUID")
    tier_name: Optional[str] = Field(
        None, description="Subscription tier name (e.g. Starter, Pro, Enterprise)"
    )
    admin_email: Optional[str] = Field(None, description="Primary admin email address")
    admin_first_name: Optional[str] = Field(
        None, description="Primary admin first name"
    )
    admin_last_name: Optional[str] = Field(None, description="Primary admin last name")
    custom_subdomain: Optional[str] = Field(
        None, description="Custom subdomain (e.g. acme.yourplatform.com)"
    )
    settings: Optional[Dict[str, Any]] = Field(default_factory=dict)


class TenantUpdateRequest(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    admin_email: Optional[str] = None
    admin_first_name: Optional[str] = None
    admin_last_name: Optional[str] = None
    settings: Optional[Dict[str, Any]] = None


class TenantStatusUpdateRequest(BaseModel):
    status: str = Field(..., description="Status: ACTIVE, SUSPENDED, CANCELLED")


class DomainCreateRequest(BaseModel):
    domain_name: str = Field(
        ..., description="Fully qualified domain name or subdomain"
    )
    is_primary: bool = False


class SubscriptionUpdateRequest(BaseModel):
    tier_id: Optional[str] = None
    tier_name: Optional[str] = None
    custom_max_users: Optional[int] = None
    custom_max_storage_gb: Optional[int] = None
    custom_feature_flags: Optional[Dict[str, Any]] = None


class DomainResponse(BaseModel):
    id: str
    tenant_id: str
    domain_name: str
    is_primary: bool
    is_verified: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TierResponse(BaseModel):
    id: str
    name: str
    display_name: str
    max_users: int
    max_storage_gb: int
    feature_flags: Dict[str, Any]
    is_active: bool

    model_config = ConfigDict(from_attributes=True)


class TenantResponse(BaseModel):
    id: str
    tenant_id: str
    name: str
    slug: str
    status: str
    tier_id: str
    tier_name: Optional[str] = None
    primary_domain: Optional[str] = None
    admin_email: Optional[str] = None
    admin_first_name: Optional[str] = None
    admin_last_name: Optional[str] = None
    settings: Dict[str, Any] = Field(default_factory=dict)
    active_users_count: int = 1
    storage_used_gb: int = 0
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TenantDetailResponse(TenantResponse):
    tier: Optional[TierResponse] = None
    domains: List[DomainResponse] = Field(default_factory=list)
    custom_max_users: Optional[int] = None
    custom_max_storage_gb: Optional[int] = None
    custom_feature_flags: Optional[Dict[str, Any]] = None


class PaginatedTenantList(BaseModel):
    items: List[TenantResponse]
    total: int
    skip: int
    limit: int


class SubscriptionResponse(BaseModel):
    tenant_id: str
    tier_id: str
    tier_name: str
    max_users: int
    max_storage_gb: int
    feature_flags: Dict[str, Any]
    custom_max_users: Optional[int] = None
    custom_max_storage_gb: Optional[int] = None


class TenantUsageResponse(BaseModel):
    tenant_id: str
    active_users: int
    storage_used_gb: int
    max_users: int
    max_storage_gb: int
    usage_percentage_users: float
    usage_percentage_storage: float


class AuditLogResponse(BaseModel):
    id: str
    tenant_id: str
    actor_id: str
    action: str
    details: Dict[str, Any]
    ip_address: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PaginatedAuditLogs(BaseModel):
    items: List[AuditLogResponse]
    total: int
    skip: int
    limit: int
