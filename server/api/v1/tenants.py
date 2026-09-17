from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status, Header
from sqlalchemy.orm import Session
from server.database import get_db
from server.schemas.tenant import (
    TenantCreate,
    TenantUpdate,
    TenantStatusUpdate,
    TenantConfigUpdate,
    TenantResponse,
    TenantConfigResponse,
    TenantDetailResponse,
    TenantUserCreate,
    TenantUserResponse,
)
from server.services.tenant_service import TenantService

router = APIRouter(prefix="/tenants", tags=["Tenants"])


@router.post("", response_model=TenantResponse, status_code=status.HTTP_201_CREATED)
def create_tenant(
    tenant_in: TenantCreate,
    db: Session = Depends(get_db),
):
    """Register a new tenant organization with unique slug and quotas."""
    return TenantService.create_tenant(db, tenant_in)


@router.get("", response_model=List[TenantResponse])
def list_tenants(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    status_filter: Optional[str] = Query(None, alias="status"),
    tier: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """List all tenants with pagination and filtering."""
    return TenantService.get_tenants(
        db,
        skip=skip,
        limit=limit,
        tenant_status=status_filter,
        tier=tier,
        search=search,
    )


@router.get("/{tenant_id}", response_model=TenantDetailResponse)
def get_tenant_detail(
    tenant_id: str,
    db: Session = Depends(get_db),
):
    """Retrieve tenant details and configuration settings."""
    return TenantService.get_tenant_by_id(db, tenant_id)


@router.put("/{tenant_id}", response_model=TenantResponse)
def update_tenant(
    tenant_id: str,
    tenant_in: TenantUpdate,
    db: Session = Depends(get_db),
):
    """Update tenant metadata, contact information, or quotas."""
    return TenantService.update_tenant(db, tenant_id, tenant_in)


@router.patch("/{tenant_id}/status", response_model=TenantResponse)
def update_tenant_status(
    tenant_id: str,
    status_in: TenantStatusUpdate,
    db: Session = Depends(get_db),
):
    """Transition tenant lifecycle status (Active, Suspended, Archived)."""
    return TenantService.update_tenant_status(db, tenant_id, status_in)


@router.put("/{tenant_id}/configuration", response_model=TenantConfigResponse)
def update_tenant_configuration(
    tenant_id: str,
    config_in: TenantConfigUpdate,
    db: Session = Depends(get_db),
):
    """Update branding, custom domain mapping, and SAML SSO configuration."""
    return TenantService.update_tenant_config(db, tenant_id, config_in)


@router.delete("/{tenant_id}", response_model=TenantResponse)
def archive_tenant(
    tenant_id: str,
    db: Session = Depends(get_db),
):
    """Archive / soft delete a tenant."""
    return TenantService.delete_tenant(db, tenant_id)


@router.post(
    "/{tenant_id}/users",
    response_model=TenantUserResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_tenant_user(
    tenant_id: str,
    user_in: TenantUserCreate,
    db: Session = Depends(get_db),
):
    """Add a user seat to a tenant organization with quota enforcement."""
    return TenantService.create_tenant_user(db, tenant_id, user_in)


@router.get("/{tenant_id}/users", response_model=List[TenantUserResponse])
def get_tenant_users(
    tenant_id: str,
    x_tenant_id: Optional[str] = Header(None, alias="X-Tenant-ID"),
    db: Session = Depends(get_db),
):
    """List users for a tenant organization (enforces row-level tenant data isolation)."""
    return TenantService.get_tenant_users(db, tenant_id, x_tenant_id)


@router.get("/{tenant_id}/telemetry")
def get_tenant_telemetry(
    tenant_id: str,
    x_tenant_id: Optional[str] = Header(None, alias="X-Tenant-ID"),
    db: Session = Depends(get_db),
):
    """Fetch live quota telemetry consumption meters for user seats, storage, and rate limits."""
    TenantService.verify_tenant_access(db, tenant_id, x_tenant_id)
    return TenantService.get_quota_telemetry(db, tenant_id)


@router.post("/{tenant_id}/storage/check")
def check_storage_quota(
    tenant_id: str,
    requested_gb: int = Query(..., ge=1),
    x_tenant_id: Optional[str] = Header(None, alias="X-Tenant-ID"),
    db: Session = Depends(get_db),
):
    """Enforce storage quota limits for a tenant."""
    TenantService.verify_tenant_access(db, tenant_id, x_tenant_id)
    return TenantService.check_storage_quota(db, tenant_id, requested_gb)
