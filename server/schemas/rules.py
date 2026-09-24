import datetime
from typing import Optional, Any
from pydantic import BaseModel, Field


class RuleCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    rule_type: str = Field(
        ..., description="AMOUNT_THRESHOLD | FREQUENCY_VELOCITY | GEOGRAPHIC_VELOCITY"
    )
    description: Optional[str] = None
    severity: str = Field("HIGH", description="LOW | MEDIUM | HIGH | CRITICAL")
    is_active: bool = True
    parameters: dict[str, Any] = Field(default_factory=dict)


class RuleUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    rule_type: Optional[str] = None
    description: Optional[str] = None
    severity: Optional[str] = None
    is_active: Optional[bool] = None
    parameters: Optional[dict[str, Any]] = None


class RuleToggleRequest(BaseModel):
    is_active: Optional[bool] = None


class RuleResponse(BaseModel):
    id: str
    name: str
    rule_type: str
    description: Optional[str] = None
    severity: str
    is_active: bool
    parameters: dict[str, Any]
    created_at: datetime.datetime
    updated_at: datetime.datetime

    class Config:
        from_attributes = True
