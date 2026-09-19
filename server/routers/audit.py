import json
from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from server.database import get_db
from server.models import AuditLog, User
from server.schemas import AuditLogResponse
from server.auth import get_current_user

router = APIRouter(prefix="/audit-logs", tags=["Audit Logs"])


@router.get("", response_model=List[AuditLogResponse])
def list_audit_logs(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    logs = (
        db.query(AuditLog)
        .order_by(AuditLog.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    results = []
    for log in logs:
        details_parsed = None
        if log.details:
            try:
                details_parsed = json.loads(log.details)
            except Exception:
                details_parsed = log.details

        results.append(
            AuditLogResponse(
                id=log.id,
                actor_id=log.actor_id,
                action=log.action,
                resource_type=log.resource_type,
                resource_id=log.resource_id,
                details=details_parsed,
                created_at=log.created_at,
            )
        )
    return results
