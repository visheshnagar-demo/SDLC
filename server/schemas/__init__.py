from server.schemas.auth import LoginRequest, UserResponse, TokenResponse
from server.schemas.patient import PatientCreateRequest, PatientUpdateRequest, PatientResponse
from server.schemas.doctor import ScheduleCreateRequest, ScheduleResponse, DoctorResponse, DoctorAvailabilityResponse
from server.schemas.appointment import AppointmentCreateRequest, AppointmentStatusUpdate, AppointmentResponse
from server.schemas.clinical_record import ClinicalRecordCreateRequest, ClinicalRecordResponse

__all__ = [
    "LoginRequest",
    "UserResponse",
    "TokenResponse",
    "PatientCreateRequest",
    "PatientUpdateRequest",
    "PatientResponse",
    "ScheduleCreateRequest",
    "ScheduleResponse",
    "DoctorResponse",
    "DoctorAvailabilityResponse",
    "AppointmentCreateRequest",
    "AppointmentStatusUpdate",
    "AppointmentResponse",
    "ClinicalRecordCreateRequest",
    "ClinicalRecordResponse",
]
