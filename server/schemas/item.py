from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field


class ItemBase(BaseModel):
    sku: str = Field(..., example="SKU-9901")
    name: str = Field(..., example="Tactical Vest")
    category: Optional[str] = Field(None, example="Gear")
    unit_price: float = Field(0.0, ge=0.0, example="150.00")
    reorder_threshold: int = Field(10, ge=0, example=10)
    reorder_quantity: int = Field(50, ge=1, example=50)


class ItemCreate(ItemBase):
    pass


class ItemUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    unit_price: Optional[float] = Field(None, ge=0.0)
    reorder_threshold: Optional[int] = Field(None, ge=0)
    reorder_quantity: Optional[int] = Field(None, ge=1)


class ItemResponse(ItemBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
