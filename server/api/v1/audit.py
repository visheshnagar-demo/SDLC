import json
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from server.database import get_db
from server.models import AuditLog
from server.schemas import AuditLogEntry

router = APIRouter(prefix="/audit-logs", tags=["audit-logs"])


@router.get("", response_model=list[AuditLogEntry])
def list_audit_logs(
    transaction_id: Optional[str] = Query(None, description="Filter by transaction ID"),
    event_type: Optional[str] = Query(None, description="Filter by event type"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
):
    query = db.query(AuditLog)

    if transaction_id:
        query = query.filter(AuditLog.transaction_id == transaction_id)

    if event_type:
        query = query.filter(AuditLog.event_type == event_type)

    query = query.order_by(AuditLog.created_at.desc())
    logs = query.offset(skip).limit(limit).all()

    results = []
    for log in logs:
        try:
            payload_dict = json.loads(log.masked_payload) if log.masked_payload else {}
        except Exception:
            payload_dict = {"raw": log.masked_payload}

        results.append(
            AuditLogEntry(
                id=str(log.id),
                transaction_id=str(log.transaction_id) if log.transaction_id else None,
                event_type=str(log.event_type),
                ip_address=str(log.ip_address),
                masked_payload=payload_dict,
                created_at=log.created_at,
            )
        )

    return results
