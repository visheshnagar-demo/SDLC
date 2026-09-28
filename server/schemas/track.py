from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict
from server.schemas.module import ModuleSummary


class TrackSummary(BaseModel):
    id: str
    title: str
    slug: str
    description: str
    difficulty: str
    estimated_hours: int
    prerequisites: Optional[str] = None
    order_index: int
    is_published: bool
    module_count: int = 0
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TrackDetail(BaseModel):
    id: str
    title: str
    slug: str
    description: str
    difficulty: str
    estimated_hours: int
    prerequisites: Optional[str] = None
    order_index: int
    is_published: bool
    modules: list[ModuleSummary] = []
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
