from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from server.database import get_db
from server.schemas.audit import AuditLogResponse, AuditLogListResponse
from server.services.audit import list_audit_logs

router = APIRouter(prefix="/audit", tags=["Audit Logs"])


@router.get(
    "",
    response_model=AuditLogListResponse,
    summary="List paginated audit log records",
)
def get_audit_logs(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    entity_type: Optional[str] = Query(None),
    entity_id: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    total, items = list_audit_logs(
        db=db,
        entity_type=entity_type,
        entity_id=entity_id,
        skip=skip,
        limit=limit,
    )
    return AuditLogListResponse(
        total=total,
        skip=skip,
        limit=limit,
        items=[AuditLogResponse.model_validate(log) for log in items],
    )
