import json
import uuid
from typing import Optional, Any
from sqlalchemy.orm import Session
from server.models.audit_log import AuditLog

class AuditService:
    @staticmethod
    def log_event(
        db: Session,
        action: str,
        resource_type: str,
        resource_id: str,
        user_id: Optional[str] = None,
        ip_address: Optional[str] = None,
        details: Optional[Any] = None,
    ):
        try:
            details_str = json.dumps(details) if details and not isinstance(details, str) else details
            log = AuditLog(
                id=str(uuid.uuid4()),
                user_id=user_id,
                action=action,
                resource_type=resource_type,
                resource_id=resource_id,
                ip_address=ip_address,
                details=details_str,
            )
            db.add(log)
            db.commit()
        except Exception:
            db.rollback()
