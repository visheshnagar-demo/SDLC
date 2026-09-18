import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator


class TodoCreate(BaseModel):
    title: str = Field(..., description="Task title (non-empty string)")
    description: Optional[str] = Field(None, description="Optional task description")

    @field_validator("title")
    @classmethod
    def title_must_not_be_blank(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Title cannot be empty")
        return v.strip()


class TodoUpdate(BaseModel):
    title: Optional[str] = Field(None, description="Updated task title")
    description: Optional[str] = Field(None, description="Updated task description")
    is_completed: Optional[bool] = Field(None, description="Completion toggle flag")

    @field_validator("title")
    @classmethod
    def title_must_not_be_blank_if_provided(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            if not v.strip():
                raise ValueError("Title cannot be empty")
            return v.strip()
        return v


class Todo(BaseModel):
    id: uuid.UUID
    title: str
    description: Optional[str] = None
    is_completed: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
