"""Pydantic models for Subjects."""

from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class SubjectBase(BaseModel):
    name: str = Field(
        ..., min_length=1, max_length=150, description="Name of the study subject"
    )
    difficulty_level: int = Field(
        3, ge=1, le=5, description="Difficulty level from 1 (easy) to 5 (very hard)"
    )
    target_date: date = Field(..., description="Target exam or completion date")
    estimated_total_hours: float = Field(
        10.0, gt=0, description="Estimated total hours needed"
    )
    color_tag: str = Field(
        "#3B82F6", max_length=20, description="Hex color or tag string"
    )


class SubjectCreate(SubjectBase):
    pass


class SubjectUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=150)
    difficulty_level: Optional[int] = Field(None, ge=1, le=5)
    target_date: Optional[date] = None
    estimated_total_hours: Optional[float] = Field(None, gt=0)
    color_tag: Optional[str] = Field(None, max_length=20)


class SubjectResponse(SubjectBase):
    id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
