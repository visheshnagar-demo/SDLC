import uuid
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from server.models import AuditLog


def create_audit_log(
    db: Session,
    actor_id: Optional[str],
    action: str,
    resource_type: str,
    resource_id: str,
    details: Optional[Dict[str, Any]] = None,
) -> AuditLog:
    audit_entry = AuditLog(
        id=str(uuid.uuid4()),
        actor_id=actor_id,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        details=details or {},
    )
    db.add(audit_entry)
    db.commit()
    db.refresh(audit_entry)
    return audit_entry
