from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from server.database import get_db
from server.models import User, AuditLog
from server.schemas import AuditLogResponse
from server.auth import get_current_admin_user

router = APIRouter(prefix="/api/v1/audit-logs", tags=["Audit Trail"])


@router.get("", response_model=List[AuditLogResponse])
def query_audit_logs(
    action: Optional[str] = None,
    resource_type: Optional[str] = None,
    actor_id: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    query = db.query(AuditLog)

    if action:
        query = query.filter(AuditLog.action.ilike(f"%{action}%"))

    if resource_type:
        query = query.filter(AuditLog.resource_type == resource_type)

    if actor_id:
        query = query.filter(AuditLog.actor_id == actor_id)

    return query.order_by(AuditLog.created_at.desc()).offset(skip).limit(limit).all()
