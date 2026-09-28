from typing import Optional, Any
from pydantic import BaseModel, ConfigDict


class TutorialSummary(BaseModel):
    id: str
    module_id: str
    title: str
    slug: str
    order_index: int
    tags: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class TutorialDetail(BaseModel):
    id: str
    module_id: str
    title: str
    slug: str
    content_markdown: str
    math_formulas: Optional[str] = None
    code_snippets: Optional[list[dict[str, Any]]] = None
    tags: Optional[str] = None
    order_index: int
    next_tutorial_slug: Optional[str] = None
    prev_tutorial_slug: Optional[str] = None
    quiz_id: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class TutorialSearchResult(BaseModel):
    id: str
    title: str
    slug: str
    module_id: str
    module_title: str
    track_title: str
    snippet: str
    tags: Optional[str] = None
    difficulty: Optional[str] = None
