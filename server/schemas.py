from datetime import datetime, date
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict


# Location Schemas
class LocationBase(BaseModel):
    name: str = Field(..., max_length=100)
    zone_type: str = Field(..., max_length=50)
    temp_min_celsius: float = Field(default=18.0)
    temp_max_celsius: float = Field(default=22.0)
    humidity_min_percent: float = Field(default=45.0)
    humidity_max_percent: float = Field(default=55.0)


class LocationCreate(LocationBase):
    pass


class LocationResponse(LocationBase):
    id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# Restoration Schemas
class RestorationBase(BaseModel):
    artifact_id: str
    conservator_name: str = Field(..., max_length=150)
    treatment_date: date
    technique: str = Field(..., max_length=150)
    materials_used: str
    assessment_notes: str
    condition_before: str = Field(..., max_length=50)
    condition_after: str = Field(..., max_length=50)


class RestorationCreate(RestorationBase):
    pass


class RestorationResponse(RestorationBase):
    id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# Environmental Reading Schemas
class EnvironmentalReadingCreate(BaseModel):
    location_id: str
    temperature_celsius: float
    humidity_percentage: float
    reading_timestamp: Optional[datetime] = None


class EnvironmentalReadingResponse(BaseModel):
    id: str
    location_id: str
    temperature_celsius: float
    humidity_percentage: float
    is_breach: bool
    breach_details: Optional[str] = None
    reading_timestamp: datetime
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# Inspection Schemas
class InspectionBase(BaseModel):
    artifact_id: str
    assigned_inspector: str = Field(..., max_length=150)
    scheduled_date: date
    inspection_status: str = Field(default="Scheduled", max_length=50)
    surface_condition: Optional[str] = None
    pest_activity: bool = False
    structural_integrity: Optional[str] = None
    findings_notes: Optional[str] = None
    next_recommended_inspection_date: Optional[date] = None


class InspectionCreate(BaseModel):
    artifact_id: str
    assigned_inspector: str = Field(..., max_length=150)
    scheduled_date: date
    inspection_status: Optional[str] = "Scheduled"
    findings_notes: Optional[str] = None


class InspectionComplete(BaseModel):
    surface_condition: str = Field(..., max_length=50)
    pest_activity: bool = False
    structural_integrity: str = Field(..., max_length=50)
    findings_notes: Optional[str] = None
    completed_date: Optional[date] = None
    next_recommended_inspection_date: Optional[date] = None


class InspectionResponse(InspectionBase):
    id: str
    completed_date: Optional[date] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# Museum Loan Schemas
class MuseumLoanBase(BaseModel):
    artifact_id: str
    partner_museum_name: str = Field(..., max_length=200)
    contact_person: str = Field(..., max_length=150)
    contact_email: str = Field(..., max_length=150)
    loan_start_date: date
    loan_end_date: date
    indemnity_valuation: float
    transit_requirements: Optional[str] = None
    loan_status: str = Field(default="Requested", max_length=50)
    return_inspection_notes: Optional[str] = None


class MuseumLoanCreate(BaseModel):
    artifact_id: str
    partner_museum_name: str = Field(..., max_length=200)
    contact_person: str = Field(..., max_length=150)
    contact_email: str = Field(..., max_length=150)
    loan_start_date: date
    loan_end_date: date
    indemnity_valuation: float
    transit_requirements: Optional[str] = None
    loan_status: Optional[str] = "Requested"


class LoanStatusUpdate(BaseModel):
    loan_status: str = Field(..., max_length=50)
    transit_notes: Optional[str] = None
    return_inspection_notes: Optional[str] = None


class MuseumLoanResponse(MuseumLoanBase):
    id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# Artifact Schemas
class ArtifactBase(BaseModel):
    accession_no: str = Field(..., max_length=50)
    title: str = Field(..., max_length=255)
    description: Optional[str] = None
    category: str = Field(..., max_length=100)
    medium: Optional[str] = None
    creation_era: Optional[str] = None
    origin: Optional[str] = None
    accession_date: date = Field(default_factory=date.today)
    current_location_id: str
    status: str = Field(default="On Display", max_length=50)
    condition_rating: str = Field(default="Good", max_length=50)
    image_url: Optional[str] = None


class ArtifactCreate(ArtifactBase):
    pass


class ArtifactUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    medium: Optional[str] = None
    creation_era: Optional[str] = None
    origin: Optional[str] = None
    accession_date: Optional[date] = None
    current_location_id: Optional[str] = None
    status: Optional[str] = None
    condition_rating: Optional[str] = None
    image_url: Optional[str] = None


class ArtifactResponse(ArtifactBase):
    id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ArtifactDetailResponse(ArtifactResponse):
    location: Optional[LocationResponse] = None
    restorations: List[RestorationResponse] = []
    inspections: List[InspectionResponse] = []
    loans: List[MuseumLoanResponse] = []

    model_config = ConfigDict(from_attributes=True)


class HealthResponse(BaseModel):
    status: str
    timestamp: datetime
    service: str
