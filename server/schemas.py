import json
from typing import List, Optional, Any, Dict
from pydantic import BaseModel, Field, ConfigDict, field_validator
from datetime import datetime


# User & Auth Schemas
class UserBase(BaseModel):
    email: str
    role: str = "GUARD"


class UserCreate(UserBase):
    password: str


class UserResponse(UserBase):
    id: str
    is_active: bool
    is_verified: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class LoginRequest(BaseModel):
    email: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    email: str


# Cell Schemas
class CellBase(BaseModel):
    cell_number: str
    block_name: str
    capacity: int = 2
    security_tier: str = "MEDIUM"  # MINIMUM, MEDIUM, MAXIMUM, HIGH_SECURITY


class CellCreate(CellBase):
    pass


class CellUpdate(BaseModel):
    cell_number: Optional[str] = None
    block_name: Optional[str] = None
    capacity: Optional[int] = None
    security_tier: Optional[str] = None
    is_active: Optional[bool] = None


class CellAssignmentRequest(BaseModel):
    inmate_id: str
    cell_id: str


class CellAssignmentResponse(BaseModel):
    status: str
    message: str
    assigned_at: str
    inmate_id: str
    cell_id: str


class CellResponse(CellBase):
    id: str
    current_occupancy: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# Inmate Schemas
class InmateBase(BaseModel):
    inmate_number: str
    first_name: str
    last_name: str
    date_of_birth: str  # YYYY-MM-DD
    security_tier: str = "MEDIUM"  # MINIMUM, MEDIUM, MAXIMUM, HIGH_SECURITY


class InmateCreate(InmateBase):
    cell_id: Optional[str] = None
    medical_alerts: List[str] = Field(default_factory=list)
    offense_history: List[Dict[str, Any]] = Field(default_factory=list)
    emergency_contacts: List[Dict[str, Any]] = Field(default_factory=list)


class InmateUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    date_of_birth: Optional[str] = None
    security_tier: Optional[str] = None
    cell_id: Optional[str] = None
    medical_alerts: Optional[List[str]] = None
    offense_history: Optional[List[Dict[str, Any]]] = None
    emergency_contacts: Optional[List[Dict[str, Any]]] = None


class InmateResponse(InmateBase):
    id: str
    cell_id: Optional[str] = None
    medical_alerts: List[str] = Field(default_factory=list)
    offense_history: List[Dict[str, Any]] = Field(default_factory=list)
    emergency_contacts: List[Dict[str, Any]] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

    @field_validator("medical_alerts", mode="before")
    @classmethod
    def parse_medical_alerts(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except Exception:
                return []
        return v or []

    @field_validator("offense_history", mode="before")
    @classmethod
    def parse_offense_history(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except Exception:
                return []
        return v or []

    @field_validator("emergency_contacts", mode="before")
    @classmethod
    def parse_emergency_contacts(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except Exception:
                return []
        return v or []


class InmateListResponse(BaseModel):
    items: List[InmateResponse]
    total: int
    skip: int
    limit: int


# Visitor Schemas
class VisitorCheckInRequest(BaseModel):
    visitor_id_number: str
    visitor_name: str
    inmate_id: str


class VisitorCheckOutRequest(BaseModel):
    visitor_log_id: str


class VisitorLogResponse(BaseModel):
    id: str
    visitor_id_number: str
    visitor_name: str
    inmate_id: str
    check_in_time: datetime
    check_out_time: Optional[datetime] = None
    status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class VisitorBlacklistCreate(BaseModel):
    visitor_id_number: str
    reason: str


class VisitorBlacklistResponse(BaseModel):
    id: str
    visitor_id_number: str
    reason: str
    banned_at: datetime

    model_config = ConfigDict(from_attributes=True)


# Audit Log Schemas
class AuditLogResponse(BaseModel):
    id: str
    user_id: Optional[str] = None
    user_role: Optional[str] = None
    action: str
    resource_type: str
    resource_id: Optional[str] = None
    payload_before: str
    payload_after: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
