from typing import Optional
from datetime import datetime
from pydantic import BaseModel


class AuditLogResponse(BaseModel):
    id: str
    item_id: str
    warehouse_id: str
    user_id: Optional[str] = None
    previous_quantity: int
    quantity_delta: int
    new_quantity: int
    reason_code: str
    notes: Optional[str] = None
    created_at: datetime
    item_sku: Optional[str] = None
    item_name: Optional[str] = None
    warehouse_name: Optional[str] = None

    class Config:
        from_attributes = True
