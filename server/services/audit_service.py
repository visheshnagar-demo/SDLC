import json
from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session
from server.models import AuditLog


def log_audit(
    db: Session,
    actor_id: Optional[str],
    action: str,
    resource_type: str,
    resource_id: Optional[str] = None,
    details: Optional[Dict[str, Any]] = None,
) -> AuditLog:
    details_str = json.dumps(details) if details else None
    audit_entry = AuditLog(
        actor_id=actor_id,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        details_json=details_str,
    )
    db.add(audit_entry)
    db.commit()
    db.refresh(audit_entry)
    return audit_entry


def get_audit_logs(
    db: Session,
    skip: int = 0,
    limit: int = 50,
    resource_type: Optional[str] = None,
    action: Optional[str] = None,
) -> List[AuditLog]:
    query = db.query(AuditLog)
    if resource_type:
        query = query.filter(AuditLog.resource_type == resource_type)
    if action:
        query = query.filter(AuditLog.action == action)

    logs = query.order_by(AuditLog.created_at.desc()).offset(skip).limit(limit).all()

    # Unpack details_json into details attribute for response schemas
    for log in logs:
        if log.details_json:
            try:
                log.details = json.loads(log.details_json)
            except Exception:
                log.details = {"raw": log.details_json}
        else:
            log.details = None

    return logs
