from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict, field_validator


class ActivityBase(BaseModel):
    time_slot: str = Field(
        default="Morning",
        description="Time of day (e.g. Morning, Lunch, Afternoon, Evening)",
    )
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    category: str = Field(default="General", max_length=100)
    estimated_cost: float = Field(default=0.0, ge=0.0)
    location: Optional[str] = None
    duration_minutes: int = Field(default=60, ge=1)
    sequence_order: int = Field(default=1, ge=1)


class ActivityCreateRequest(ActivityBase):
    day_id: Optional[str] = None


class ActivityUpdateRequest(BaseModel):
    time_slot: Optional[str] = None
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    category: Optional[str] = None
    estimated_cost: Optional[float] = Field(None, ge=0.0)
    location: Optional[str] = None
    duration_minutes: Optional[int] = Field(None, ge=1)
    sequence_order: Optional[int] = Field(None, ge=1)


class ActivityResponse(ActivityBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    day_id: str
    created_at: datetime
    updated_at: datetime


class ActivityReorderItem(BaseModel):
    activity_id: str
    day_id: str
    sequence_order: int = Field(..., ge=1)


class ActivityReorderRequest(BaseModel):
    activities: List[ActivityReorderItem]


class ItineraryDayResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    day_number: int
    date: Optional[str] = None
    daily_estimated_cost: float
    activities: List[ActivityResponse] = []
    created_at: datetime
    updated_at: datetime


class ItineraryGenerateRequest(BaseModel):
    destination: str = Field(
        ..., min_length=1, max_length=255, description="Destination city/country"
    )
    budget: float = Field(
        ..., gt=0.0, description="Total travel budget must be positive"
    )
    currency: str = Field(default="USD", min_length=1, max_length=10)
    duration_days: int = Field(
        ..., ge=1, le=30, description="Duration in days must be between 1 and 30"
    )
    interests: List[str] = Field(
        default_factory=list, description="List of interest tags"
    )
    user_id: Optional[str] = None

    @field_validator("destination")
    @classmethod
    def validate_destination(cls, v: str) -> str:
        v_strip = v.strip()
        if not v_strip:
            raise ValueError("Destination cannot be blank")
        return v_strip


class ItineraryUpdateRequest(BaseModel):
    destination: Optional[str] = Field(None, min_length=1, max_length=255)
    budget: Optional[float] = Field(None, gt=0.0)
    currency: Optional[str] = Field(None, min_length=1, max_length=10)
    duration_days: Optional[int] = Field(None, ge=1, le=30)
    interests: Optional[List[str]] = None


class ItineraryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: Optional[str] = None
    destination: str
    budget: float
    currency: str
    duration_days: int
    interests: List[str] = []
    total_estimated_cost: float
    budget_status: str
    share_token: str
    days: List[ItineraryDayResponse] = []
    created_at: datetime
    updated_at: datetime


class BudgetSummaryResponse(BaseModel):
    total_estimated_cost: float
    budget: float
    currency: str
    budget_status: str
    remaining_budget: float


class ShareResponse(BaseModel):
    share_token: str
    share_url: str
