from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class WarehouseBase(BaseModel):
    code: str = Field(..., description="Unique warehouse code")
    name: str = Field(..., description="Warehouse name")
    location: Optional[str] = Field(None, description="Location details")


class WarehouseCreate(WarehouseBase):
    pass


class WarehouseResponse(WarehouseBase):
    id: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
