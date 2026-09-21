from typing import Optional
from sqlalchemy.orm import Session
from server.models.audit import AuditLog


def log_audit_event(
    db: Session,
    action: str,
    resource: str,
    user_id: Optional[str] = None,
    user_role: Optional[str] = None,
    details: Optional[str] = None,
    ip_address: Optional[str] = None,
) -> AuditLog:
    log_entry = AuditLog(
        user_id=user_id,
        user_role=user_role,
        action=action,
        resource=resource,
        details=details,
        ip_address=ip_address,
    )
    db.add(log_entry)
    db.commit()
    db.refresh(log_entry)
    return log_entry
