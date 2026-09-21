from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class StockAdjustmentResponse(BaseModel):
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
    sku: Optional[str] = None
    item_name: Optional[str] = None
    warehouse_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
