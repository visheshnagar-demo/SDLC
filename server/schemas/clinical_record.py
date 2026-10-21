from typing import Optional
from datetime import datetime
from pydantic import BaseModel

class ClinicalRecordCreateRequest(BaseModel):
    symptoms: Optional[str] = None
    diagnosis: str
    prescription: str
    notes: Optional[str] = None
    follow_up_date: Optional[str] = None

class ClinicalRecordResponse(BaseModel):
    id: str
    appointment_id: str
    patient_id: str
    doctor_id: str
    symptoms: Optional[str] = None
    diagnosis: str
    prescription: str
    notes: Optional[str] = None
    follow_up_date: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
