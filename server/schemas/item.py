from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class ItemBase(BaseModel):
    sku: str = Field(..., description="Unique Stock Keeping Unit")
    name: str = Field(..., description="Item name")
    category: Optional[str] = Field(None, description="Item category")
    unit_price: float = Field(0.0, ge=0.0, description="Unit price")
    reorder_threshold: int = Field(10, ge=0, description="Reorder threshold quantity")
    reorder_quantity: int = Field(50, ge=1, description="Standard reorder quantity")


class ItemCreate(ItemBase):
    pass


class ItemUpdate(BaseModel):
    sku: Optional[str] = None
    name: Optional[str] = None
    category: Optional[str] = None
    unit_price: Optional[float] = Field(None, ge=0.0)
    reorder_threshold: Optional[int] = Field(None, ge=0)
    reorder_quantity: Optional[int] = Field(None, ge=1)


class ItemResponse(ItemBase):
    id: str
    created_at: datetime
    updated_at: datetime
    total_stock: int = 0

    model_config = ConfigDict(from_attributes=True)
