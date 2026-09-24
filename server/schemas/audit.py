import datetime
from typing import Any
from pydantic import BaseModel


class AuditLogResponse(BaseModel):
    id: str
    entity_type: str
    entity_id: str
    action: str
    actor: str
    changes: dict[str, Any]
    created_at: datetime.datetime

    class Config:
        from_attributes = True


class AuditLogListResponse(BaseModel):
    total: int
    skip: int
    limit: int
    items: list[AuditLogResponse]
