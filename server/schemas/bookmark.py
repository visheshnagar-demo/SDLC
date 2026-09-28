from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict
from server.schemas.tutorial import TutorialSummary


class BookmarkOut(BaseModel):
    id: str
    user_id: str
    tutorial_id: str
    created_at: datetime
    tutorial: Optional[TutorialSummary] = None

    model_config = ConfigDict(from_attributes=True)


class BookmarkToggleResponse(BaseModel):
    bookmarked: bool
    message: str
    bookmark: Optional[BookmarkOut] = None
