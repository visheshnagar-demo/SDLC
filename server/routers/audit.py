from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from server.database import get_db
from server.models import User, AuditLog
from server.schemas import AuditLogListResponse
from server.dependencies import get_current_user

router = APIRouter(prefix="/api/v1/audit", tags=["HIPAA Security & Audit Logging"])


@router.get("/logs", response_model=AuditLogListResponse)
def get_audit_logs(
    user_id: Optional[str] = None,
    resource_type: Optional[str] = None,
    action: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(AuditLog)

    # RBAC: Only ADMIN can view full system audit logs.
    # Non-admins can only see their own access history.
    if current_user.role != "ADMIN":
        query = query.filter(AuditLog.user_id == current_user.id)
    elif user_id:
        query = query.filter(AuditLog.user_id == user_id)

    if resource_type:
        query = query.filter(AuditLog.resource_type == resource_type.upper())

    if action:
        query = query.filter(AuditLog.action.ilike(f"%{action}%"))

    total = query.count()
    items = query.order_by(AuditLog.timestamp.desc()).offset(skip).limit(limit).all()

    return AuditLogListResponse(total=total, items=items)
