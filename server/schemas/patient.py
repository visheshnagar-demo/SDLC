from typing import Optional, List
from datetime import date, datetime
from pydantic import BaseModel, EmailStr


class PatientCreateRequest(BaseModel):
    first_name: str
    last_name: str
    date_of_birth: date
    gender: str
    phone_number: str
    email: Optional[EmailStr] = None
    address: Optional[str] = None
    emergency_contact_name: str
    emergency_contact_phone: str
    insurance_provider: Optional[str] = None
    insurance_policy_number: Optional[str] = None


class PatientUpdateRequest(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    phone_number: Optional[str] = None
    email: Optional[EmailStr] = None
    address: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    insurance_provider: Optional[str] = None
    insurance_policy_number: Optional[str] = None


class PatientResponse(BaseModel):
    id: str
    user_id: Optional[str] = None
    patient_code: str
    first_name: str
    last_name: str
    date_of_birth: date
    gender: str
    phone_number: str
    email: Optional[str] = None
    address: Optional[str] = None
    emergency_contact_name: str
    emergency_contact_phone: str
    insurance_provider: Optional[str] = None
    insurance_policy_number: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class PaginatedPatients(BaseModel):
    items: List[PatientResponse]
    total: int
    skip: int
    limit: int
