from typing import Optional, List
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from server.database import get_db
from server.schemas import (
    TenantCreateRequest,
    TenantUpdateRequest,
    TenantStatusUpdateRequest,
    DomainCreateRequest,
    TenantResponse,
    TenantDetailResponse,
    PaginatedTenantList,
    DomainResponse,
    TenantUsageResponse,
    PaginatedAuditLogs,
    AuditLogResponse,
    TierResponse,
)
from server.services.tenant_service import TenantService

router = APIRouter(prefix="/api/v1/tenants", tags=["tenants"])


def _format_tenant_response(tenant) -> TenantResponse:
    primary_dom = None
    if tenant.domains:
        primary = next((d for d in tenant.domains if d.is_primary), tenant.domains[0])
        primary_dom = primary.domain_name

    tier_name = tenant.tier.name if tenant.tier else None

    return TenantResponse(
        id=tenant.id,
        tenant_id=tenant.tenant_id,
        name=tenant.name,
        slug=tenant.slug,
        status=tenant.status,
        tier_id=tenant.tier_id,
        tier_name=tier_name,
        primary_domain=primary_dom or tenant.custom_subdomain,
        admin_email=tenant.admin_email,
        admin_first_name=tenant.admin_first_name,
        admin_last_name=tenant.admin_last_name,
        settings=tenant.settings or {},
        active_users_count=tenant.active_users_count,
        storage_used_gb=tenant.storage_used_gb,
        created_at=tenant.created_at,
        updated_at=tenant.updated_at,
    )


@router.post("", response_model=TenantResponse, status_code=status.HTTP_201_CREATED)
def create_tenant(req: TenantCreateRequest, db: Session = Depends(get_db)):
    tenant = TenantService.create_tenant(db, req)
    return _format_tenant_response(tenant)


@router.get("", response_model=PaginatedTenantList)
def list_tenants(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    status: Optional[str] = Query(
        None, description="Filter by status: ACTIVE, SUSPENDED, CANCELLED"
    ),
    db: Session = Depends(get_db),
):
    tenants, total = TenantService.list_tenants(
        db, skip=skip, limit=limit, status=status
    )
    items = [_format_tenant_response(t) for t in tenants]
    return PaginatedTenantList(items=items, total=total, skip=skip, limit=limit)


@router.get("/{id}", response_model=TenantDetailResponse)
def get_tenant_details(id: str, db: Session = Depends(get_db)):
    tenant = TenantService.get_tenant_by_id(db, id)
    resp = _format_tenant_response(tenant)

    tier_resp = None
    if tenant.tier:
        tier_resp = TierResponse.model_validate(tenant.tier)

    domain_resps = [DomainResponse.model_validate(d) for d in tenant.domains]

    quota = tenant.quotas
    custom_max_users = quota.custom_max_users if quota else None
    custom_max_storage = quota.custom_max_storage_gb if quota else None
    custom_flags = quota.custom_feature_flags if quota else None

    return TenantDetailResponse(
        **resp.model_dump(),
        tier=tier_resp,
        domains=domain_resps,
        custom_max_users=custom_max_users,
        custom_max_storage_gb=custom_max_storage,
        custom_feature_flags=custom_flags,
    )


@router.put("/{id}", response_model=TenantResponse)
def update_tenant(id: str, req: TenantUpdateRequest, db: Session = Depends(get_db)):
    tenant = TenantService.update_tenant(db, id, req)
    return _format_tenant_response(tenant)


@router.patch("/{id}/status", response_model=TenantResponse)
def update_tenant_status(
    id: str, req: TenantStatusUpdateRequest, db: Session = Depends(get_db)
):
    tenant = TenantService.update_tenant_status(db, id, req.status)
    return _format_tenant_response(tenant)


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_tenant(id: str, db: Session = Depends(get_db)):
    TenantService.soft_delete_tenant(db, id)
    return None


@router.post(
    "/{id}/domains", response_model=DomainResponse, status_code=status.HTTP_201_CREATED
)
def add_domain(id: str, req: DomainCreateRequest, db: Session = Depends(get_db)):
    domain = TenantService.add_tenant_domain(db, id, req)
    return DomainResponse.model_validate(domain)


@router.get("/{id}/domains", response_model=List[DomainResponse])
def list_domains(id: str, db: Session = Depends(get_db)):
    domains = TenantService.list_tenant_domains(db, id)
    return [DomainResponse.model_validate(d) for d in domains]


@router.delete("/{id}/domains/{domain_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_domain(id: str, domain_id: str, db: Session = Depends(get_db)):
    TenantService.delete_tenant_domain(db, id, domain_id)
    return None


@router.get("/{id}/usage", response_model=TenantUsageResponse)
def get_tenant_usage(id: str, db: Session = Depends(get_db)):
    usage = TenantService.get_tenant_usage(db, id)
    return TenantUsageResponse(**usage)


@router.get("/{id}/audit-logs", response_model=PaginatedAuditLogs)
def get_tenant_audit_logs(
    id: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
):
    logs, total = TenantService.get_audit_logs(db, id, skip=skip, limit=limit)
    items = [AuditLogResponse.model_validate(l) for l in logs]
    return PaginatedAuditLogs(items=items, total=total, skip=skip, limit=limit)
