import json
import uuid
from typing import Optional, Any
from sqlalchemy.orm import Session
from server.models import AuditLog


def create_audit_log(
    db: Session,
    action: str,
    resource_type: str,
    resource_id: str,
    actor_id: Optional[str] = None,
    details: Optional[Any] = None,
) -> AuditLog:
    details_str = json.dumps(details) if details is not None else None
    audit_entry = AuditLog(
        id=str(uuid.uuid4()),
        actor_id=actor_id,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        details=details_str,
    )
    db.add(audit_entry)
    try:
        db.commit()
        db.refresh(audit_entry)
    except Exception:
        db.rollback()
    return audit_entry
