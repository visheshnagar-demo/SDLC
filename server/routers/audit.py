"""Audit and Compliance Logging Router."""

from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from server.database import get_db
from server.models import AuditLog, User
from server.schemas import AuditLogOut
from server.security import get_current_user

router = APIRouter(prefix="/audit-logs", tags=["Audit Logs"])


@router.get("", response_model=List[AuditLogOut])
def list_audit_logs(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    action: Optional[str] = None,
    user_email: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve immutable audit event logs for compliance and security monitoring."""
    query = db.query(AuditLog)

    if action:
        query = query.filter(AuditLog.action == action)
    if user_email:
        query = query.filter(AuditLog.user_email == user_email)

    audit_logs = (
        query.order_by(AuditLog.created_at.desc()).offset(skip).limit(limit).all()
    )
    return audit_logs
