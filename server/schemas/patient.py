from typing import Optional
from datetime import datetime
from pydantic import BaseModel

class PatientCreateRequest(BaseModel):
    first_name: str
    last_name: str
    date_of_birth: str
    gender: str
    phone_number: str
    emergency_contact_name: str
    emergency_contact_phone: str
    email: Optional[str] = None
    address: Optional[str] = None
    insurance_provider: Optional[str] = None
    insurance_policy_number: Optional[str] = None

class PatientUpdateRequest(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None
    phone_number: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    insurance_provider: Optional[str] = None
    insurance_policy_number: Optional[str] = None

class PatientResponse(BaseModel):
    id: str
    patient_code: str
    first_name: str
    last_name: str
    date_of_birth: str
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
