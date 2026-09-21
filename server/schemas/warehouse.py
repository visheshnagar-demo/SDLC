from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field


class WarehouseBase(BaseModel):
    code: str = Field(..., example="WH-MAIN")
    name: str = Field(..., example="Main Warehouse")
    location: Optional[str] = Field(None, example="Building A")


class WarehouseCreate(WarehouseBase):
    pass


class WarehouseResponse(WarehouseBase):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True
