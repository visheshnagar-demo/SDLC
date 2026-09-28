from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class ModuleTouchRequest(BaseModel):
    is_completed: Optional[bool] = None


class RecentModuleOut(BaseModel):
    id: str
    title: str
    slug: str
    track_title: str
    last_accessed_at: datetime


class TrackProgressOut(BaseModel):
    track_id: str
    title: str
    slug: str
    total_modules: int
    completed_modules: int
    completion_percentage: float


class UserProgressDashboard(BaseModel):
    overall_completion_percentage: float
    total_modules: int
    completed_modules: int
    quizzes_passed: int
    recent_module: Optional[RecentModuleOut] = None
    track_progress: list[TrackProgressOut] = []
    completed_module_ids: list[str] = []
