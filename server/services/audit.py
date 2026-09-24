import uuid
import datetime
from typing import Optional, Any
from sqlalchemy.orm import Session
from sqlalchemy import desc
from server.models.entities import AuditLog


def create_audit_log(
    db: Session,
    entity_type: str,
    entity_id: str,
    action: str,
    actor: str = "system",
    changes: Optional[dict[str, Any]] = None,
) -> AuditLog:
    log_entry = AuditLog(
        id=str(uuid.uuid4()),
        entity_type=entity_type,
        entity_id=entity_id,
        action=action,
        actor=actor or "system",
        changes=changes or {},
        created_at=datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None),
    )
    db.add(log_entry)
    db.commit()
    db.refresh(log_entry)
    return log_entry


def list_audit_logs(
    db: Session,
    entity_type: Optional[str] = None,
    entity_id: Optional[str] = None,
    skip: int = 0,
    limit: int = 20,
) -> tuple[int, list[AuditLog]]:
    query = db.query(AuditLog)
    if entity_type:
        query = query.filter(AuditLog.entity_type == entity_type)
    if entity_id:
        query = query.filter(AuditLog.entity_id == entity_id)

    total = query.count()
    items = query.order_by(desc(AuditLog.created_at)).offset(skip).limit(limit).all()
    return total, items
