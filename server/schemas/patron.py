from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class PatronBase(BaseModel):
    full_name: str = Field(..., min_length=1, max_length=255, description="Full name")
    email: str = Field(..., min_length=3, max_length=255, description="Email address")
    phone_number: Optional[str] = Field(
        None, max_length=50, description="Optional phone number"
    )


class PatronCreate(PatronBase):
    pass


class PatronUpdate(BaseModel):
    full_name: Optional[str] = Field(None, min_length=1, max_length=255)
    phone_number: Optional[str] = Field(None, max_length=50)
    account_status: Optional[str] = Field(None, max_length=32)


class PatronResponse(PatronBase):
    id: str
    max_borrow_limit: int
    account_status: str
    total_fines_due: float
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
