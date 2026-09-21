from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class InventoryStockBase(BaseModel):
    item_id: str
    warehouse_id: str
    quantity_on_hand: int = Field(0, ge=0)


class InventoryStockResponse(InventoryStockBase):
    id: str
    updated_at: datetime
    sku: Optional[str] = None
    item_name: Optional[str] = None
    warehouse_name: Optional[str] = None
    category: Optional[str] = None
    unit_price: Optional[float] = None
    reorder_threshold: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)


class StockAdjustmentCreate(BaseModel):
    item_id: Optional[str] = None
    warehouse_id: str
    quantity_delta: Optional[int] = None
    quantity: Optional[int] = None
    adjustment_type: Optional[str] = None  # e.g. "add", "remove", "set"
    reason_code: str = Field(
        ..., description="e.g. DAMAGED_GOODS, STOCK_INBOUND, RECONCILIATION, TRANSFER"
    )
    notes: Optional[str] = None
    user_id: Optional[str] = None
