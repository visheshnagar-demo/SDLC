from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class FitnessClassBase(BaseModel):
    title: str
    category: str
    description: Optional[str] = None
    instructor_name: str
    start_time: datetime
    end_time: datetime
    max_capacity: int


class FitnessClassCreate(FitnessClassBase):
    pass


class FitnessClassUpdate(BaseModel):
    title: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    instructor_name: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    max_capacity: Optional[int] = None


class FitnessClassRead(FitnessClassBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    booked_count: int
    available_spots: int
    is_full: bool
    created_at: datetime
