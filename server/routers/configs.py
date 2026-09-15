from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from server.database import get_db
from server.schemas import TenantConfigUpdate, TenantConfigResponse
from server.services import config_service

router = APIRouter(prefix="/api/v1/tenants", tags=["Tenant Config & Quotas"])


@router.get("/{tenant_id}/config", response_model=TenantConfigResponse)
def get_tenant_config(tenant_id: str, db: Session = Depends(get_db)):
    return config_service.get_tenant_config(db, tenant_id)


@router.put("/{tenant_id}/config", response_model=TenantConfigResponse)
def update_tenant_config(
    tenant_id: str,
    data: TenantConfigUpdate,
    request: Request,
    db: Session = Depends(get_db),
):
    ip_address = request.client.host if request.client else None
    return config_service.update_tenant_config(
        db, tenant_id, data, ip_address=ip_address
    )
