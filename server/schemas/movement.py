from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel


class MovementCreate(BaseModel):
    inmate_id: str
    source_location: str
    destination_location: str
    purpose: str
    escort_officer: str
    expected_duration_minutes: int = 30


class MovementResponse(BaseModel):
    id: str
    inmate_id: str
    source_location: str
    destination_location: str
    purpose: str
    escort_officer: str
    departure_time: datetime
    expected_arrival_time: datetime
    arrival_time: Optional[datetime] = None
    status: str
    is_overdue: bool
    created_at: datetime

    class Config:
        from_attributes = True


class HeadcountUnitSummary(BaseModel):
    unit_id: str
    unit_name: str
    capacity: int
    assigned_count: int
    in_transit_count: int
    physical_count: int


class HeadcountResponse(BaseModel):
    total_facility_capacity: int
    total_active_inmates: int
    total_in_transit: int
    units: List[HeadcountUnitSummary]
