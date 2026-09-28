from typing import Optional
from pydantic import BaseModel, ConfigDict
from server.schemas.tutorial import TutorialSummary


class ModuleSummary(BaseModel):
    id: str
    track_id: str
    title: str
    slug: str
    summary: str
    difficulty: str
    estimated_minutes: int
    prerequisites: Optional[str] = None
    order_index: int
    tutorial_count: int = 0
    has_quiz: bool = False

    model_config = ConfigDict(from_attributes=True)


class ModuleDetail(BaseModel):
    id: str
    track_id: str
    title: str
    slug: str
    summary: str
    difficulty: str
    estimated_minutes: int
    prerequisites: Optional[str] = None
    order_index: int
    track_title: Optional[str] = None
    tutorials: list[TutorialSummary] = []
    quiz_id: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
