from datetime import datetime
from typing import Any, Dict, Optional, Union
from pydantic import BaseModel


class EmergencyContactSchema(BaseModel):
    name: str
    relationship: str
    phone: str


class InsuranceInfoSchema(BaseModel):
    provider: str
    policy_number: str
    group_number: Optional[str] = None


class PatientCreate(BaseModel):
    first_name: str
    last_name: str
    date_of_birth: str  # YYYY-MM-DD
    gender: str
    national_id: str
    phone: str
    address: Optional[str] = None
    emergency_contact: Union[EmergencyContactSchema, Dict[str, Any]]
    insurance_info: Optional[Union[InsuranceInfoSchema, Dict[str, Any]]] = None
    user_id: Optional[str] = None


class PatientUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    emergency_contact: Optional[Union[EmergencyContactSchema, Dict[str, Any]]] = None
    insurance_info: Optional[Union[InsuranceInfoSchema, Dict[str, Any]]] = None


class PatientResponse(BaseModel):
    id: str
    user_id: Optional[str] = None
    first_name: str
    last_name: str
    date_of_birth: str
    gender: str
    national_id: str
    phone: str
    address: Optional[str] = None
    emergency_contact: Dict[str, Any]
    insurance_info: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
