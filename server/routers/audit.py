import io
import csv
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.orm import Session
from server.database import get_db
from server.schemas import AuditLogResponse
from server.services import audit_service

router = APIRouter(prefix="/audit", tags=["Audit"])


@router.get("/logs", response_model=List[AuditLogResponse])
def query_audit_logs(
    actor_id: Optional[str] = Query(None),
    action_type: Optional[str] = Query(None),
    entity_name: Optional[str] = Query(None),
    entity_id: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    logs = audit_service.get_audit_logs(
        db,
        actor_id=actor_id,
        action_type=action_type,
        entity_name=entity_name,
        entity_id=entity_id,
        skip=skip,
        limit=limit,
    )
    return [AuditLogResponse.model_validate(log) for log in logs]


@router.get("/export")
def export_audit_reports(
    actor_id: Optional[str] = Query(None),
    action_type: Optional[str] = Query(None),
    entity_name: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    logs = audit_service.get_audit_logs(
        db,
        actor_id=actor_id,
        action_type=action_type,
        entity_name=entity_name,
        limit=1000,
    )

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(
        [
            "ID",
            "Timestamp",
            "Actor ID",
            "Action Type",
            "Entity Name",
            "Entity ID",
            "IP Address",
        ]
    )

    for log in logs:
        writer.writerow(
            [
                log.id,
                log.created_at.isoformat() if log.created_at else "",
                log.actor_id or "",
                log.action_type or "",
                log.entity_name or "",
                log.entity_id or "",
                log.ip_address or "",
            ]
        )

    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=audit_report.csv"},
    )
