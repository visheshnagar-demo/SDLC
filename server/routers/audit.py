from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from server.database import get_db
from server.schemas import AuditLogListResponse
from server.services import audit_service

router = APIRouter(prefix="/api/v1/tenants", tags=["Tenant Audit Logs"])


@router.get("/{tenant_id}/audit-logs", response_model=AuditLogListResponse)
def get_tenant_audit_logs(
    tenant_id: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    items, total = audit_service.get_tenant_audit_logs(
        db, tenant_id, skip=skip, limit=limit
    )
    return AuditLogListResponse(items=items, total=total, skip=skip, limit=limit)
