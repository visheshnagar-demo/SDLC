from typing import Optional
from datetime import datetime
from pydantic import BaseModel


class HousingUnitResponse(BaseModel):
    id: str
    unit_name: str
    security_level: str
    capacity: int
    current_occupancy: int
    created_at: datetime

    class Config:
        from_attributes = True


class HousingAssignRequest(BaseModel):
    inmate_id: str
    unit_id: str
    cell_number: str
    supervisor_override: bool = False
    override_reason: Optional[str] = None


class HousingAssignResponse(BaseModel):
    assignment_id: str
    inmate_id: str
    unit_id: str
    unit_name: str
    cell_number: str
    assigned_at: datetime
    is_override: bool = False
    status: str = "assigned"


class KeepAwayRuleCreate(BaseModel):
    inmate_id: str
    keep_away_inmate_id: str
    reason: str


class KeepAwayRuleResponse(BaseModel):
    id: str
    inmate_id: str
    keep_away_inmate_id: str
    reason: str
    created_at: datetime

    class Config:
        from_attributes = True
