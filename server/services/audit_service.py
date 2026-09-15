from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from server.models import AuditLog


def create_audit_log(
    db: Session,
    tenant_id: str,
    action: str,
    entity_type: str,
    entity_id: Optional[str] = None,
    actor_id: Optional[str] = None,
    details: Optional[Dict[str, Any]] = None,
    ip_address: Optional[str] = None,
) -> AuditLog:
    """
    Appends an immutable audit log entry.
    """
    log_entry = AuditLog(
        tenant_id=tenant_id,
        actor_id=actor_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        details=details or {},
        ip_address=ip_address,
    )
    db.add(log_entry)
    db.commit()
    db.refresh(log_entry)
    return log_entry


def get_tenant_audit_logs(
    db: Session,
    tenant_id: str,
    skip: int = 0,
    limit: int = 20,
):
    query = (
        db.query(AuditLog)
        .filter(AuditLog.tenant_id == tenant_id)
        .order_by(AuditLog.created_at.desc())
    )
    total = query.count()
    items = query.offset(skip).limit(limit).all()
    return items, total
