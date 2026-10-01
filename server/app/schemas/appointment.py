from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel


class AppointmentCreate(BaseModel):
    patient_id: str
    doctor_id: str
    appointment_time: datetime
    duration_minutes: Optional[int] = 30
    reason: Optional[str] = None


class AppointmentStatusUpdate(BaseModel):
    status: str  # SCHEDULED, CONFIRMED, CANCELLED, COMPLETED


class AppointmentResponse(BaseModel):
    id: str
    patient_id: str
    doctor_id: str
    appointment_time: datetime
    duration_minutes: int
    status: str
    reason: Optional[str] = None
    patient_name: Optional[str] = None
    doctor_name: Optional[str] = None
    doctor_specialty: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TimeSlot(BaseModel):
    start_time: str
    end_time: str
    is_available: bool


class DoctorAvailabilityResponse(BaseModel):
    doctor_id: str
    doctor_name: str
    specialty: str
    department: str
    date: str
    available_slots: List[TimeSlot]
