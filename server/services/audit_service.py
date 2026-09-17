import uuid
from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session
from server.models import AuditLog


def create_audit_log(
    db: Session,
    action_type: str,
    entity_name: str,
    entity_id: Optional[str] = None,
    actor_id: Optional[str] = None,
    before_state: Optional[Dict[str, Any]] = None,
    after_state: Optional[Dict[str, Any]] = None,
    ip_address: Optional[str] = None,
) -> AuditLog:
    log_entry = AuditLog(
        id=str(uuid.uuid4()),
        actor_id=actor_id,
        action_type=action_type,
        entity_name=entity_name,
        entity_id=entity_id,
        before_state=before_state,
        after_state=after_state,
        ip_address=ip_address,
    )
    db.add(log_entry)
    # caller manages commit or flush
    return log_entry


def get_audit_logs(
    db: Session,
    actor_id: Optional[str] = None,
    action_type: Optional[str] = None,
    entity_name: Optional[str] = None,
    entity_id: Optional[str] = None,
    skip: int = 0,
    limit: int = 20,
) -> List[AuditLog]:
    query = db.query(AuditLog)
    if actor_id:
        query = query.filter(AuditLog.actor_id == actor_id)
    if action_type:
        query = query.filter(AuditLog.action_type == action_type)
    if entity_name:
        query = query.filter(AuditLog.entity_name == entity_name)
    if entity_id:
        query = query.filter(AuditLog.entity_id == entity_id)

    return query.order_by(AuditLog.created_at.desc()).offset(skip).limit(limit).all()
