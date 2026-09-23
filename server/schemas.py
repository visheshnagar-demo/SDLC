from typing import List, Optional
from pydantic import BaseModel, Field


# ------------------- Activity Schemas -------------------


class ActivityBase(BaseModel):
    time_slot: str = Field(
        ..., description="Time slot or time interval, e.g. '09:00 - 11:00'"
    )
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    category: str = Field(..., min_length=1, max_length=100)
    estimated_cost: float = Field(0.0, ge=0.0)
    location: Optional[str] = ""
    duration_minutes: Optional[int] = Field(60, ge=1)
    sequence_order: Optional[int] = Field(0, ge=0)


class ActivityCreate(ActivityBase):
    day_id: Optional[str] = None
    day_number: Optional[int] = None


class ActivityUpdate(BaseModel):
    time_slot: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    estimated_cost: Optional[float] = Field(None, ge=0.0)
    location: Optional[str] = None
    duration_minutes: Optional[int] = Field(None, ge=1)
    sequence_order: Optional[int] = Field(None, ge=0)


class ActivityResponse(ActivityBase):
    id: str
    day_id: str

    class Config:
        from_attributes = True


class ActivityReorderItem(BaseModel):
    activity_id: str
    sequence_order: int
    day_id: Optional[str] = None


class ActivityReorderRequest(BaseModel):
    activities: Optional[List[ActivityReorderItem]] = None
    activity_ids: Optional[List[str]] = None
    day_id: Optional[str] = None


# ------------------- Itinerary Day Schemas -------------------


class ItineraryDayBase(BaseModel):
    day_number: int
    date: Optional[str] = None
    daily_estimated_cost: float = 0.0


class ItineraryDayResponse(ItineraryDayBase):
    id: str
    itinerary_id: str
    activities: List[ActivityResponse] = []

    class Config:
        from_attributes = True


# ------------------- Itinerary Schemas -------------------


class ItineraryGenerateRequest(BaseModel):
    destination: str = Field(..., min_length=1, description="Destination city/country")
    budget: float = Field(..., gt=0.0, description="Total budget, must be > 0")
    currency: Optional[str] = Field("USD", description="Currency code (e.g. USD, EUR)")
    duration_days: int = Field(..., ge=1, le=30, description="Duration in days (1-30)")
    interests: List[str] = Field(
        default_factory=list, description="List of interest categories"
    )


class ItineraryUpdateRequest(BaseModel):
    destination: Optional[str] = None
    budget: Optional[float] = Field(None, gt=0.0)
    currency: Optional[str] = None
    duration_days: Optional[int] = Field(None, ge=1, le=30)
    interests: Optional[List[str]] = None


class ItineraryResponse(BaseModel):
    id: str
    destination: str
    budget: float
    currency: str
    duration_days: int
    interests: List[str] = []
    total_estimated_cost: float
    budget_status: str
    share_token: Optional[str] = None
    days: List[ItineraryDayResponse] = []

    class Config:
        from_attributes = True


class ShareResponse(BaseModel):
    share_token: str
    share_url: str
