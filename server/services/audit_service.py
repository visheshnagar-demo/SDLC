import uuid
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from server.models import TenantAuditLog


class AuditService:
    @staticmethod
    def log_action(
        db: Session,
        tenant_id: str,
        action: str,
        details: Optional[Dict[str, Any]] = None,
        actor_id: str = "system_admin",
        ip_address: Optional[str] = None,
    ) -> TenantAuditLog:
        audit = TenantAuditLog(
            id=str(uuid.uuid4()),
            tenant_id=tenant_id,
            actor_id=actor_id,
            action=action,
            details=details or {},
            ip_address=ip_address,
        )
        db.add(audit)
        db.commit()
        db.refresh(audit)
        return audit
