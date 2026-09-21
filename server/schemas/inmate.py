from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel


class ChargeCreate(BaseModel):
    charge_code: str
    description: str
    severity: Optional[str] = "FELONY"
    bail_amount: Optional[float] = None


class ChargeResponse(BaseModel):
    id: str
    charge_code: str
    description: str
    severity: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class PropertyItemCreate(BaseModel):
    item_name: Optional[str] = None
    item_description: Optional[str] = None
    quantity: int = 1
    condition: Optional[str] = "Good"
    location: Optional[str] = "Property Locker A"
    category: Optional[str] = None
    storage_bin: Optional[str] = None


class PropertyItemResponse(BaseModel):
    id: str
    item_name: str
    quantity: int
    condition: Optional[str] = None
    location: Optional[str] = None
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class InmateCreate(BaseModel):
    first_name: str
    last_name: str
    date_of_birth: str
    gender: str
    ssn: Optional[str] = None
    security_level: Optional[str] = "MEDIUM"
    gang_affiliation: Optional[str] = None
    medical_alerts: Optional[str] = None
    mugshot_url: Optional[str] = None
    fingerprint_hash: Optional[str] = None
    charges: Optional[List[ChargeCreate]] = []
    property_items: Optional[List[PropertyItemCreate]] = []


class InmateResponse(BaseModel):
    id: str
    first_name: str
    last_name: str
    date_of_birth: str
    gender: str
    ssn_hash: Optional[str] = None
    booking_number: str
    security_level: str
    gang_affiliation: Optional[str] = None
    medical_alerts: Optional[str] = None
    mugshot_url: Optional[str] = None
    fingerprint_hash: Optional[str] = None
    status: str
    created_at: datetime
    updated_at: datetime
    charges: List[ChargeResponse] = []
    property_items: List[PropertyItemResponse] = []

    class Config:
        from_attributes = True


class DuplicateCheckResponse(BaseModel):
    is_duplicate: bool
    message: str
    existing_inmate_id: Optional[str] = None
    booking_number: Optional[str] = None
