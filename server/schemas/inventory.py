from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field


class StockAdjustmentCreate(BaseModel):
    item_id: Optional[str] = None
    warehouse_id: Optional[str] = None
    quantity_delta: Optional[int] = None
    quantity: Optional[int] = None
    adjustment_type: Optional[str] = Field(None, example="ADD")  # ADD, REMOVE, SET
    reason_code: str = Field(..., example="STOCK_INBOUND")
    notes: Optional[str] = None
    user_id: Optional[str] = None


class StockTransferCreate(BaseModel):
    item_id: str = Field(..., example="item-uuid")
    from_warehouse_id: str = Field(..., example="wh-1")
    to_warehouse_id: str = Field(..., example="wh-2")
    quantity: int = Field(..., gt=0, example=5)
    reason_code: str = Field("TRANSFER", example="TRANSFER")
    notes: Optional[str] = None
    user_id: Optional[str] = None


class InventoryStockResponse(BaseModel):
    id: str
    item_id: str
    warehouse_id: str
    quantity_on_hand: int
    updated_at: datetime
    item_sku: Optional[str] = None
    item_name: Optional[str] = None
    warehouse_code: Optional[str] = None
    warehouse_name: Optional[str] = None

    class Config:
        from_attributes = True


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
    item_sku: Optional[str] = None
    item_name: Optional[str] = None
    warehouse_name: Optional[str] = None

    class Config:
        from_attributes = True


class StockTransferResponse(BaseModel):
    item_id: str
    item_sku: str
    from_warehouse_id: str
    from_warehouse_name: str
    to_warehouse_id: str
    to_warehouse_name: str
    quantity_transferred: int
    from_warehouse_new_stock: int
    to_warehouse_new_stock: int
    transferred_at: datetime
