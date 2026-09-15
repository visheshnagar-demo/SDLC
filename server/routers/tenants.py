from typing import Optional
from fastapi import APIRouter, Depends, Query, Request, status
from sqlalchemy.orm import Session
from server.database import get_db
from server.schemas import (
    TenantOnboardRequest,
    TenantOnboardResponse,
    TenantResponse,
    TenantListResponse,
    TenantStatusUpdate,
)
from server.services import tenant_service

router = APIRouter(prefix="/api/v1/tenants", tags=["Tenants"])


@router.post(
    "", response_model=TenantOnboardResponse, status_code=status.HTTP_201_CREATED
)
def onboard_tenant(
    data: TenantOnboardRequest, request: Request, db: Session = Depends(get_db)
):
    ip_address = request.client.host if request.client else None
    return tenant_service.onboard_tenant(db, data, ip_address=ip_address)


@router.get("", response_model=TenantListResponse)
def list_tenants(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    items, total = tenant_service.list_tenants(
        db, skip=skip, limit=limit, status_filter=status
    )
    return TenantListResponse(items=items, total=total, skip=skip, limit=limit)


@router.get("/{tenant_id}", response_model=TenantResponse)
def get_tenant_details(tenant_id: str, db: Session = Depends(get_db)):
    return tenant_service.get_tenant_by_id_or_slug(db, tenant_id)


@router.patch("/{tenant_id}/status", response_model=TenantResponse)
def update_tenant_status(
    tenant_id: str,
    data: TenantStatusUpdate,
    request: Request,
    db: Session = Depends(get_db),
):
    ip_address = request.client.host if request.client else None
    return tenant_service.update_tenant_status(
        db, tenant_id, data.status, ip_address=ip_address
    )
