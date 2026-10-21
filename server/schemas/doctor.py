from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel

class ScheduleCreateRequest(BaseModel):
    day_of_week: int
    start_time: str
    end_time: str
    is_active: bool = True

class ScheduleResponse(BaseModel):
    id: str
    doctor_id: str
    day_of_week: int
    start_time: str
    end_time: str
    is_active: bool

    class Config:
        from_attributes = True

class DoctorResponse(BaseModel):
    id: str
    user_id: str
    doctor_code: str
    department: str
    qualification: str
    consultation_fee: float
    slot_duration_minutes: int
    is_available: bool
    full_name: Optional[str] = None
    email: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class DoctorAvailabilityResponse(BaseModel):
    doctor_id: str
    date: str
    available_slots: List[str]
    slot_duration_minutes: int = 30
