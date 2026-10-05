from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class BookBase(BaseModel):
    isbn: str = Field(
        ..., min_length=1, max_length=32, description="ISBN-10 or ISBN-13"
    )
    title: str = Field(..., min_length=1, max_length=255, description="Book title")
    author: str = Field(..., min_length=1, max_length=255, description="Author name")
    genre: str = Field(
        ..., min_length=1, max_length=100, description="Genre classification"
    )
    publication_year: int = Field(..., description="Year of publication")
    total_copies: int = Field(1, ge=0, description="Total physical copies in library")


class BookCreate(BookBase):
    pass


class BookUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    author: Optional[str] = Field(None, min_length=1, max_length=255)
    genre: Optional[str] = Field(None, min_length=1, max_length=100)
    publication_year: Optional[int] = None
    total_copies: Optional[int] = Field(None, ge=0)


class BookResponse(BookBase):
    id: str
    available_copies: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
