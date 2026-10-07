from datetime import date, datetime
from typing import List, Optional, Any, Dict, Union
from pydantic import BaseModel, EmailStr, ConfigDict, Field


# -------------------------------------------------------------
# User & Auth Schemas
# -------------------------------------------------------------
class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    phone_number: Optional[str] = None
    role: str = "PATIENT"
    is_active: bool = True


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    phone_number: Optional[str] = None
    phone: Optional[str] = None  # alias support
    role: Optional[str] = "PATIENT"


class UserLogin(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    password: str


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    email: str
    full_name: str
    phone_number: Optional[str] = None
    role: str
    is_active: bool
    created_at: Optional[datetime] = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    user_id: str
    user: Optional[UserResponse] = None


# -------------------------------------------------------------
# Patient Schemas
# -------------------------------------------------------------
class PatientCreate(BaseModel):
    user_id: Optional[str] = None
    national_id: str
    date_of_birth: Optional[date] = None
    dob: Optional[date] = None  # alias
    gender: str
    blood_group: Optional[str] = None
    address: Optional[str] = None
    emergency_contact_name: str
    emergency_contact_phone: str
    insurance_provider: Optional[str] = None
    insurance_policy_number: Optional[str] = None


class PatientUpdate(BaseModel):
    gender: Optional[str] = None
    blood_group: Optional[str] = None
    address: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    insurance_provider: Optional[str] = None
    insurance_policy_number: Optional[str] = None


class PatientResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    national_id: str
    date_of_birth: date
    gender: str
    blood_group: Optional[str] = None
    address: Optional[str] = None
    emergency_contact_name: str
    emergency_contact_phone: str
    insurance_provider: Optional[str] = None
    insurance_policy_number: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    user: Optional[UserResponse] = None


class PatientListResponse(BaseModel):
    total: int
    items: List[PatientResponse]


# -------------------------------------------------------------
# Doctor Schemas
# -------------------------------------------------------------
class DoctorCreate(BaseModel):
    user_id: str
    department: str
    specialization: str
    consultation_fee: float = 0.0
    slot_duration_minutes: int = 30
    is_available: bool = True


class DoctorResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    department: str
    specialization: str
    consultation_fee: float
    slot_duration_minutes: int
    is_available: bool
    created_at: Optional[datetime] = None
    user: Optional[UserResponse] = None


# -------------------------------------------------------------
# Appointment Schemas
# -------------------------------------------------------------
class AppointmentSlot(BaseModel):
    slot_start: datetime
    slot_end: datetime
    is_available: bool


class AppointmentCreate(BaseModel):
    patient_id: str
    doctor_id: str
    start_time: datetime
    end_time: Optional[datetime] = None
    reason: Optional[str] = None


class AppointmentStatusUpdate(BaseModel):
    status: str
    cancellation_reason: Optional[str] = None


class AppointmentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    patient_id: str
    doctor_id: str
    start_time: datetime
    end_time: datetime
    status: str
    reason: Optional[str] = None
    cancellation_reason: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    patient: Optional[PatientResponse] = None
    doctor: Optional[DoctorResponse] = None


# -------------------------------------------------------------
# EHR Schemas
# -------------------------------------------------------------
class PrescriptionItem(BaseModel):
    medication_name: str
    dosage: str
    frequency: str
    duration_days: Union[int, str]


class EHRRecordCreate(BaseModel):
    patient_id: str
    doctor_id: Optional[str] = None
    appointment_id: Optional[str] = None
    diagnosis: str
    clinical_notes: str
    prescriptions: List[Dict[str, Any]] = Field(default_factory=list)
    lab_orders: List[Any] = Field(default_factory=list)


class EHRRecordUpdate(BaseModel):
    diagnosis: Optional[str] = None
    clinical_notes: Optional[str] = None
    prescriptions: Optional[List[Dict[str, Any]]] = None
    lab_orders: Optional[List[Any]] = None


class EHRRecordResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    patient_id: str
    doctor_id: str
    appointment_id: Optional[str] = None
    diagnosis: str
    clinical_notes: str
    prescriptions: List[Dict[str, Any]] = Field(default_factory=list)
    lab_orders: List[Any] = Field(default_factory=list)
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    patient: Optional[PatientResponse] = None
    doctor: Optional[DoctorResponse] = None


class PrescriptionDownloadResponse(BaseModel):
    download_url: str
    expires_in_seconds: int = 300
    prescription_summary: Optional[Dict[str, Any]] = None


# -------------------------------------------------------------
# Audit Log Schemas
# -------------------------------------------------------------
class AuditLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: Optional[str] = None
    action: str
    resource_type: str
    resource_id: Optional[str] = None
    ip_address: Optional[str] = None
    timestamp: datetime
    details: Optional[Dict[str, Any]] = None


class AuditLogListResponse(BaseModel):
    total: int
    items: List[AuditLogResponse]
