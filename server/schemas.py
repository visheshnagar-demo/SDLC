from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict


class ClassificationAuditLogRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    email_id: str
    previous_category: Optional[str] = None
    new_category: str
    action: str
    reason: Optional[str] = None
    created_at: datetime


class EmailCreateText(BaseModel):
    subject: Optional[str] = None
    body: str = Field(default="", description="Raw email text or content")


class CategoryOverride(BaseModel):
    category: str = Field(
        ...,
        description="Target category: Work, Personal, Urgent, Promotional, or Uncategorized",
    )
    reason: Optional[str] = Field(
        None, description="Optional reason for manual override"
    )


class EmailRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    subject: Optional[str] = None
    body: str
    preview: Optional[str] = None
    file_name: Optional[str] = None
    file_type: Optional[str] = None
    category: str
    original_category: Optional[str] = None
    confidence_score: float
    status: str
    is_overridden: bool
    created_at: datetime
    updated_at: datetime
    audit_logs: List[ClassificationAuditLogRead] = []


class EmailListResponse(BaseModel):
    items: List[EmailRead]
    total: int
    skip: int = 0
    limit: int = 20


class EmailStatsResponse(BaseModel):
    total: int = 0
    urgent: int = 0
    work: int = 0
    personal: int = 0
    promotional: int = 0
    uncategorized: int = 0
    overridden: int = 0
