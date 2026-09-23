"""Pydantic schemas package."""

from server.schemas.subject import SubjectCreate, SubjectUpdate, SubjectResponse
from server.schemas.availability import (
    AvailabilitySlot,
    AvailabilityBatchCreate,
    AvailabilityResponse,
)
from server.schemas.schedule import (
    ScheduleGenerateRequest,
    StudySessionResponse,
    SessionStatusUpdate,
    PriorityRecommendationResponse,
    StudyPlanResponse,
    StudyPlanDetailResponse,
)

__all__ = [
    "SubjectCreate",
    "SubjectUpdate",
    "SubjectResponse",
    "AvailabilitySlot",
    "AvailabilityBatchCreate",
    "AvailabilityResponse",
    "ScheduleGenerateRequest",
    "StudySessionResponse",
    "SessionStatusUpdate",
    "PriorityRecommendationResponse",
    "StudyPlanResponse",
    "StudyPlanDetailResponse",
]
