from datetime import datetime

from pydantic import BaseModel, Field, field_validator

VALID_CATEGORIES = {"Work", "Personal", "Urgent", "Promotional"}


class EmailClassifyRequest(BaseModel):
    text: str = Field(..., min_length=1, description="Raw email body text")
    subject: str | None = Field(None, max_length=500, description="Email subject")
    sender: str | None = Field(None, max_length=255, description="Sender email or name")


class ClassificationResponse(BaseModel):
    id: str | None = None
    primary_category: str
    ai_category: str | None = None
    confidence_score: float
    user_override_category: str | None = None
    is_overridden: bool = False
    all_scores: dict[str, float] | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None

    class Config:
        from_attributes = True


class EmailResponse(BaseModel):
    id: str
    sender: str | None = None
    subject: str | None = None
    excerpt: str
    body_text: str
    source_type: str
    file_name: str | None = None
    classification: ClassificationResponse | None = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class EmailListResponse(BaseModel):
    total: int
    skip: int
    limit: int
    items: list[EmailResponse]


class CategoryOverrideRequest(BaseModel):
    category: str = Field(
        ..., description="Target category: Work, Personal, Urgent, or Promotional"
    )

    @field_validator("category")
    @classmethod
    def validate_category(cls, v: str) -> str:
        # Normalize title case e.g. "work" -> "Work"
        formatted = v.strip().capitalize()
        if formatted not in VALID_CATEGORIES:
            raise ValueError(
                f"Invalid category '{v}'. Allowed categories are: {', '.join(sorted(VALID_CATEGORIES))}"
            )
        return formatted


class EmailOverrideResponse(BaseModel):
    id: str
    classification: ClassificationResponse
    updated_at: datetime

    class Config:
        from_attributes = True


class MetricsResponse(BaseModel):
    total_processed: int
    work_count: int
    personal_count: int
    urgent_count: int
    promotional_count: int
    overridden_count: int
