"""Audit log viewing router."""

from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from server.auth import get_current_user
from server.database import get_db
from server.models import AuditLog, User
from server.schemas import AuditLogResponse

router = APIRouter(prefix="/audit-logs", tags=["audit"])


@router.get("", response_model=List[AuditLogResponse])
def list_audit_logs(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    action: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    user_email: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve immutable security audit trail logs with filtering and pagination."""
    query = db.query(AuditLog)
    if action:
        query = query.filter(AuditLog.action == action)
    if status_filter:
        query = query.filter(AuditLog.status == status_filter.upper())
    if user_email:
        query = query.filter(AuditLog.user_email == user_email)

    logs = query.order_by(AuditLog.created_at.desc()).offset(skip).limit(limit).all()
    return logs
