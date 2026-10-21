import json
import uuid
from typing import Optional, Any
from sqlalchemy.orm import Session
from server.models import AuditLog


def log_action(
    db: Session,
    action: str,
    resource_type: str,
    resource_id: str,
    user_id: Optional[str] = None,
    ip_address: Optional[str] = None,
    details: Optional[Any] = None,
):
    try:
        details_str = None
        if details is not None:
            if isinstance(details, (dict, list)):
                details_str = json.dumps(details)
            else:
                details_str = str(details)

        audit_entry = AuditLog(
            id=str(uuid.uuid4()),
            user_id=user_id,
            action=action,
            resource_type=resource_type,
            resource_id=str(resource_id),
            ip_address=ip_address,
            details=details_str,
        )
        db.add(audit_entry)
        db.commit()
    except Exception:
        db.rollback()
