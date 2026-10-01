import json
import uuid
from typing import Any, Dict, List, Optional
from sqlalchemy.orm import Session
from server.app.models.audit_log import AuditLog


def log_audit(
    db: Session,
    action: str,
    entity_type: str,
    entity_id: Optional[str] = None,
    user_id: Optional[str] = None,
    details: Optional[Dict[str, Any]] = None,
    ip_address: Optional[str] = None,
) -> AuditLog:
    details_str = json.dumps(details) if details is not None else None
    audit_entry = AuditLog(
        id=str(uuid.uuid4()),
        user_id=user_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        details=details_str,
        ip_address=ip_address,
    )
    db.add(audit_entry)
    db.commit()
    db.refresh(audit_entry)
    return audit_entry


def get_audit_logs(
    db: Session,
    skip: int = 0,
    limit: int = 50,
    entity_type: Optional[str] = None,
    user_id: Optional[str] = None,
) -> List[AuditLog]:
    query = db.query(AuditLog)
    if entity_type:
        query = query.filter(AuditLog.entity_type == entity_type)
    if user_id:
        query = query.filter(AuditLog.user_id == user_id)
    return query.order_by(AuditLog.timestamp.desc()).offset(skip).limit(limit).all()
