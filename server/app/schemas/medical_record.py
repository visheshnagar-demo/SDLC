from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel


# Lab Orders
class LabOrderCreate(BaseModel):
    encounter_id: str
    test_name: str
    priority: Optional[str] = "ROUTINE"
    notes: Optional[str] = None


class LabOrderResponse(BaseModel):
    id: str
    encounter_id: str
    test_name: str
    priority: str
    status: str
    notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# Prescriptions
class PrescriptionCreate(BaseModel):
    encounter_id: str
    medication_name: str
    dosage: str
    frequency: str
    duration: str
    instructions: Optional[str] = None


class PrescriptionResponse(BaseModel):
    id: str
    encounter_id: str
    medication_name: str
    dosage: str
    frequency: str
    duration: str
    instructions: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# Clinical Note Addendums
class ClinicalNoteAddendumCreate(BaseModel):
    addendum_text: str


class ClinicalNoteAddendumResponse(BaseModel):
    id: str
    note_id: str
    author_id: str
    author_name: Optional[str] = None
    addendum_text: str
    created_at: datetime

    class Config:
        from_attributes = True


# Clinical Notes
class ClinicalNoteCreate(BaseModel):
    encounter_id: str
    doctor_id: str
    note_text: str
    diagnosis: str
    is_signed: Optional[bool] = False


class ClinicalNoteResponse(BaseModel):
    id: str
    encounter_id: str
    doctor_id: str
    doctor_name: Optional[str] = None
    note_text: str
    diagnosis: str
    is_signed: bool
    signed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    addendums: List[ClinicalNoteAddendumResponse] = []

    class Config:
        from_attributes = True


# Encounters
class EncounterCreate(BaseModel):
    patient_id: str
    doctor_id: str
    appointment_id: Optional[str] = None
    encounter_date: Optional[datetime] = None
    chief_complaint: str
    status: Optional[str] = "OPEN"


class EncounterResponse(BaseModel):
    id: str
    patient_id: str
    doctor_id: str
    appointment_id: Optional[str] = None
    encounter_date: datetime
    chief_complaint: str
    status: str
    created_at: datetime
    updated_at: datetime
    notes: List[ClinicalNoteResponse] = []
    prescriptions: List[PrescriptionResponse] = []
    lab_orders: List[LabOrderResponse] = []

    class Config:
        from_attributes = True
