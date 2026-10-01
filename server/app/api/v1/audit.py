import json
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from server.app.api.deps import (
    get_optional_current_user,
)
from server.app.core.database import get_db
from server.app.models.audit_log import AuditLog
from server.app.models.user import User
from server.app.schemas.audit_log import AuditLogResponse
from server.app.services.audit_service import get_audit_logs

router = APIRouter(prefix="/audit", tags=["audit"])


def _format_audit_log(entry: AuditLog) -> AuditLogResponse:
    details: Optional[Dict[str, Any]] = None
    if entry.details:
        try:
            details = json.loads(entry.details)
        except Exception:
            details = {"raw": entry.details}

    return AuditLogResponse(
        id=entry.id,
        user_id=entry.user_id,
        action=entry.action,
        entity_type=entry.entity_type,
        entity_id=entry.entity_id,
        details=details,
        ip_address=entry.ip_address,
        timestamp=entry.timestamp,
    )


@router.get("/logs", response_model=List[AuditLogResponse])
def list_audit_logs(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    entity_type: Optional[str] = None,
    user_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    logs = get_audit_logs(
        db=db,
        skip=skip,
        limit=limit,
        entity_type=entity_type,
        user_id=user_id,
    )
    return [_format_audit_log(entry) for entry in logs]
