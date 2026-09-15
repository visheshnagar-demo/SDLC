import re
from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field, field_validator

EMAIL_REGEX = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


# User / Auth Schemas
class UserBase(BaseModel):
    email: str
    full_name: str
    department: str | None = None
    role: str = "HOST"
    is_active: bool = True

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        if not EMAIL_REGEX.match(v.strip()):
            raise ValueError("Invalid email format")
        return v.strip().lower()


class UserCreate(UserBase):
    password: str


class UserResponse(UserBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class HostSummary(BaseModel):
    id: str
    full_name: str
    email: str
    department: str | None = None

    class Config:
        from_attributes = True


class LoginRequest(BaseModel):
    email: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class TokenData(BaseModel):
    email: str | None = None
    role: str | None = None
    user_id: str | None = None


# Visitor Schemas
class VisitorBase(BaseModel):
    full_name: str
    email: str
    phone: str
    company: str | None = None

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        if not EMAIL_REGEX.match(v.strip()):
            raise ValueError("Invalid email format")
        return v.strip().lower()


class VisitorCreate(VisitorBase):
    pass


class VisitorResponse(VisitorBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Pre-Registration Schema
class VisitorRegisterRequest(BaseModel):
    full_name: str = Field(..., min_length=1, description="Visitor's full name")
    email: str = Field(..., description="Visitor's email address")
    phone: str = Field(..., min_length=1, description="Visitor's contact number")
    company: str | None = Field(None, description="Visitor's organization")
    purpose: str = Field(..., min_length=1, description="Reason for visit")
    scheduled_start_time: datetime = Field(
        ..., description="Scheduled arrival start datetime"
    )
    scheduled_end_time: datetime | None = Field(
        None, description="Scheduled arrival end datetime"
    )
    host_id: str = Field(..., description="UUID of the host employee")

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        if not EMAIL_REGEX.match(v.strip()):
            raise ValueError("Invalid email format")
        return v.strip().lower()


# Action Schemas
class ApprovalActionRequest(BaseModel):
    action: str = Field(..., description="'APPROVE' or 'REJECT'")
    approval_notes: str | None = Field(None, description="Optional notes from host")


class CheckInRequest(BaseModel):
    badge_id: str | None = Field(None, description="Physical badge identifier")


# Audit Log Schema
class VisitAuditLogResponse(BaseModel):
    id: str
    visit_id: str
    actor_id: str | None = None
    actor_role: str
    action: str
    details: Any | None = None
    created_at: datetime

    class Config:
        from_attributes = True


# Visit Detail Schema
class VisitResponse(BaseModel):
    id: str
    visitor_id: str
    host_id: str
    purpose: str
    scheduled_start_time: datetime
    scheduled_end_time: datetime | None = None
    status: str
    pass_code: str | None = None
    approval_notes: str | None = None
    approved_at: datetime | None = None
    check_in_time: datetime | None = None
    check_out_time: datetime | None = None
    badge_id: str | None = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class VisitDetailResponse(VisitResponse):
    visitor: VisitorResponse
    host: HostSummary
    audit_logs: list[VisitAuditLogResponse] = []

    class Config:
        from_attributes = True


class PaginatedVisitResponse(BaseModel):
    items: list[VisitDetailResponse]
    total: int
    skip: int
    limit: int
