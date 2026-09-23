from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class EmailCreateText(BaseModel):
    subject: Optional[str] = None
    body: str = Field(..., description="Raw text of the email")


class CategoryOverride(BaseModel):
    category: str = Field(
        ...,
        description="New category: Work, Personal, Urgent, Promotional, or Uncategorized",
    )
    reason: Optional[str] = Field(
        None, description="Optional reason for the manual override"
    )


class ClassificationAuditLogRead(BaseModel):
    id: str
    email_id: str
    previous_category: str
    new_category: str
    reason: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class EmailRead(BaseModel):
    id: str
    subject: Optional[str] = None
    body: str
    preview: Optional[str] = None
    file_name: Optional[str] = None
    file_type: Optional[str] = None
    category: str
    original_category: str
    confidence_score: float
    status: str
    is_overridden: bool
    created_at: datetime
    updated_at: datetime
    audit_logs: Optional[List[ClassificationAuditLogRead]] = []

    model_config = ConfigDict(from_attributes=True)


class EmailListResponse(BaseModel):
    items: List[EmailRead]
    total: int
    skip: int = 0
    limit: int = 20

    model_config = ConfigDict(from_attributes=True)
