from datetime import datetime
from typing import Any, Dict, Optional
from pydantic import BaseModel


class AuditLogCreate(BaseModel):
    user_id: Optional[str] = None
    action: str
    entity_type: str
    entity_id: Optional[str] = None
    details: Optional[Dict[str, Any]] = None
    ip_address: Optional[str] = None


class AuditLogResponse(BaseModel):
    id: str
    user_id: Optional[str] = None
    action: str
    entity_type: str
    entity_id: Optional[str] = None
    details: Optional[Dict[str, Any]] = None
    ip_address: Optional[str] = None
    timestamp: datetime

    class Config:
        from_attributes = True
