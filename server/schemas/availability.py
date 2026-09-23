"""Pydantic models for Availability Profiles."""

from datetime import datetime
from typing import List
from pydantic import BaseModel, ConfigDict, Field


class AvailabilitySlot(BaseModel):
    day_of_week: str = Field(
        ..., description="Day of week, e.g., MONDAY, TUESDAY, etc."
    )
    available_minutes: int = Field(
        120, ge=0, le=1440, description="Available study minutes for this day"
    )
    preferred_time_of_day: str = Field(
        "EVENING", description="Preferred time: MORNING, AFTERNOON, EVENING"
    )


class AvailabilityBatchCreate(BaseModel):
    weekly_slots: List[AvailabilitySlot] = Field(
        ..., min_length=1, description="List of daily availability settings"
    )


class AvailabilityResponse(BaseModel):
    id: str
    day_of_week: str
    available_minutes: int
    preferred_time_of_day: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
