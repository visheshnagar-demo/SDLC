from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel
from server.schemas.patient import PatientResponse
from server.schemas.doctor import DoctorResponse


class AppointmentCreateRequest(BaseModel):
    patient_id: str
    doctor_id: str
    scheduled_start: datetime
    reason_for_visit: Optional[str] = None


class AppointmentStatusUpdate(BaseModel):
    status: str  # PENDING, CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED
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
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    patient: Optional[PatientResponse] = None
    doctor: Optional[DoctorResponse] = None

    class Config:
        from_attributes = True


class PaginatedAppointments(BaseModel):
    items: List[AppointmentResponse]
    total: int
    skip: int
    limit: int
