"""Pydantic models for Schedules, Sessions, and Priority Recommendations."""

from datetime import date, datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field
from server.schemas.subject import SubjectResponse


class ScheduleGenerateRequest(BaseModel):
    plan_title: str = Field(
        ..., min_length=1, max_length=200, description="Title of the study plan"
    )
    start_date: date = Field(..., description="Schedule start date")
    end_date: date = Field(..., description="Schedule end date")
    subject_ids: List[str] = Field(
        ..., min_length=1, description="List of subject UUIDs to schedule"
    )
    daily_max_minutes: int = Field(
        300, ge=30, le=1440, description="Maximum study minutes per day"
    )
    include_recommendations: bool = Field(
        True, description="Whether to compute AI priority recommendations"
    )


class SessionStatusUpdate(BaseModel):
    status: str = Field(
        ...,
        description="Updated session status: PENDING, COMPLETED, SKIPPED, RESCHEDULED",
    )


class StudySessionResponse(BaseModel):
    id: str
    study_plan_id: str
    subject_id: str
    session_date: date
    start_time: Optional[str] = None
    duration_minutes: int
    topic_focus: Optional[str] = None
    status: str
    created_at: datetime
    updated_at: datetime
    subject: Optional[SubjectResponse] = None

    model_config = ConfigDict(from_attributes=True)


class PriorityRecommendationResponse(BaseModel):
    id: str
    study_plan_id: str
    subject_id: str
    priority_rank: int
    urgency_score: float
    recommendation_text: str
    allocated_hours: Optional[float] = None
    subject_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PrioritySummary(BaseModel):
    subject_name: str
    priority_rank: int
    allocated_hours: float
    recommendation_text: str


class StudyPlanResponse(BaseModel):
    id: str
    title: str
    start_date: date
    end_date: date
    total_study_hours: float
    status: str
    sessions_count: int = 0
    priorities: List[PrioritySummary] = []
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class StudyPlanDetailResponse(BaseModel):
    id: str
    title: str
    start_date: date
    end_date: date
    total_study_hours: float
    status: str
    sessions: List[StudySessionResponse] = []
    priorities: List[PriorityRecommendationResponse] = []
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
