from server.schemas.auth import (
    LoginRequest,
    RegisterRequest,
    UserResponse,
    TokenResponse,
)
from server.schemas.patient import (
    PatientCreateRequest,
    PatientUpdateRequest,
    PatientResponse,
    PaginatedPatients,
)
from server.schemas.doctor import (
    DoctorCreateRequest,
    DoctorResponse,
    ScheduleCreateRequest,
    ScheduleResponse,
    TimeSlot,
    DoctorAvailabilityResponse,
)
from server.schemas.appointment import (
    AppointmentCreateRequest,
    AppointmentStatusUpdate,
    AppointmentResponse,
    PaginatedAppointments,
)
from server.schemas.clinical_record import (
    ClinicalRecordCreateRequest,
    ClinicalRecordResponse,
)

__all__ = [
    "LoginRequest",
    "RegisterRequest",
    "UserResponse",
    "TokenResponse",
    "PatientCreateRequest",
    "PatientUpdateRequest",
    "PatientResponse",
    "PaginatedPatients",
    "DoctorCreateRequest",
    "DoctorResponse",
    "ScheduleCreateRequest",
    "ScheduleResponse",
    "TimeSlot",
    "DoctorAvailabilityResponse",
    "AppointmentCreateRequest",
    "AppointmentStatusUpdate",
    "AppointmentResponse",
    "PaginatedAppointments",
    "ClinicalRecordCreateRequest",
    "ClinicalRecordResponse",
]
