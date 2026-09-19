from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from server.database import get_db
from server.models import User
from server.schemas import AuditLogOut
from server.auth import get_current_user
from server.services.audit_service import get_audit_logs

router = APIRouter(prefix="/api/v1/audit-logs", tags=["Audit"])


@router.get("", response_model=List[AuditLogOut])
def list_audit_logs(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    resource_type: Optional[str] = Query(None),
    action: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_audit_logs(
        db=db, skip=skip, limit=limit, resource_type=resource_type, action=action
    )
