from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


class EmailCreateText(BaseModel):
    subject: Optional[str] = None
    body: str = Field(..., min_length=0)


class CategoryOverride(BaseModel):
    category: str = Field(
        ...,
        description="Target category: Work, Personal, Urgent, Promotional, or Uncategorized",
    )


class EmailRead(BaseModel):
    id: str
    subject: Optional[str] = None
    body: str
    preview: str
    file_name: Optional[str] = None
    file_type: Optional[str] = None
    category: str
    original_category: str
    confidence_score: float
    status: str
    is_overridden: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class EmailListResponse(BaseModel):
    total: int
    skip: int
    limit: int
    items: List[EmailRead]


class AuditLogRead(BaseModel):
    id: str
    email_id: str
    previous_category: str
    new_category: str
    modified_by: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
