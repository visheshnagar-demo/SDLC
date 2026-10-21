from typing import Optional, Any
from datetime import datetime
from pydantic import BaseModel, model_validator

class AppointmentCreateRequest(BaseModel):
    doctor_id: str
    patient_id: str
    scheduled_start: Optional[datetime] = None
    scheduled_time: Optional[datetime] = None
    scheduled_end: Optional[datetime] = None
    reason_for_visit: Optional[str] = None

    @model_validator(mode="before")
    @classmethod
    def check_schedule_time(cls, data: Any) -> Any:
        if isinstance(data, dict):
            if "scheduled_start" not in data and "scheduled_time" in data:
                data["scheduled_start"] = data["scheduled_time"]
            elif "scheduled_time" not in data and "scheduled_start" in data:
                data["scheduled_time"] = data["scheduled_start"]
        return data

class AppointmentStatusUpdate(BaseModel):
    status: str
    cancellation_reason: Optional[str] = None

class AppointmentResponse(BaseModel):
    id: str
    appointment_code: str
    patient_id: str
    doctor_id: str
    scheduled_start: datetime
    scheduled_end: datetime
    status: str
    reason_for_visit: Optional[str] = None
    cancellation_reason: Optional[str] = None
    created_by: Optional[str] = None
    patient_name: Optional[str] = None
    doctor_name: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
