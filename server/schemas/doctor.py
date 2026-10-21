from typing import Optional, List
from datetime import time, date, datetime
from decimal import Decimal
from pydantic import BaseModel
from server.schemas.auth import UserResponse


class ScheduleCreateRequest(BaseModel):
    day_of_week: int  # 0 to 6
    start_time: time
    end_time: time
    is_active: Optional[bool] = True


class ScheduleResponse(BaseModel):
    id: str
    doctor_id: str
    day_of_week: int
    start_time: time
    end_time: time
    is_active: bool

    class Config:
        from_attributes = True


class DoctorCreateRequest(BaseModel):
    user_id: str
    doctor_code: Optional[str] = None
    department: str
    qualification: str
    consultation_fee: Decimal = Decimal("0.00")
    slot_duration_minutes: int = 30
    is_available: bool = True


class DoctorResponse(BaseModel):
    id: str
    user_id: str
    doctor_code: str
    department: str
    qualification: str
    consultation_fee: Decimal
    slot_duration_minutes: int
    is_available: bool
    user: Optional[UserResponse] = None
    schedules: Optional[List[ScheduleResponse]] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class TimeSlot(BaseModel):
    start_time: str
    end_time: str
    is_available: bool


class DoctorAvailabilityResponse(BaseModel):
    doctor_id: str
    date: date
    slot_duration_minutes: int
    available_slots: List[TimeSlot]
