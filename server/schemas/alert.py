from typing import Optional
from pydantic import BaseModel, Field


class LowStockAlertResponse(BaseModel):
    item_id: str
    sku: str
    item_name: str
    warehouse_id: Optional[str] = None
    warehouse_name: Optional[str] = None
    current_stock: int
    reorder_threshold: int
    deficit: int
    suggested_reorder_quantity: int
    status: str = Field("LOW_STOCK", example="LOW_STOCK")

    class Config:
        from_attributes = True
