"""Pydantic schemas for request and response validation."""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field


# -----------------------------
# User & Auth Schemas
# -----------------------------
class UserBase(BaseModel):
    email: EmailStr
    role: str = "read_only"
    is_active: bool = True


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
    role: str = "read_only"


class UserResponse(UserBase):
    id: str
    is_verified: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


# -----------------------------
# Cloud Provider Schemas
# -----------------------------
class CloudProviderBase(BaseModel):
    name: str
    provider_type: str  # AWS, GCP, AZURE
    account_id: Optional[str] = None
    region: Optional[str] = None


class CloudProviderCreate(CloudProviderBase):
    credentials_encrypted: Optional[str] = None


class CloudProviderResponse(CloudProviderBase):
    id: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# -----------------------------
# Cloud Instance Schemas
# -----------------------------
class CloudInstanceBase(BaseModel):
    name: str
    provider_id: str
    region: str
    instance_type: str
    image_id: Optional[str] = None


class CloudInstanceCreate(CloudInstanceBase):
    pass


class CloudInstanceResponse(CloudInstanceBase):
    id: str
    external_instance_id: str
    status: str
    public_ip: Optional[str] = None
    private_ip: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class InstanceActionRequest(BaseModel):
    action: str = Field(..., description="Action: START, STOP, RESTART, TERMINATE")


class InstanceActionResponse(BaseModel):
    action: str
    previous_status: str
    current_status: str
    message: str


# -----------------------------
# Telemetry Metrics Schemas
# -----------------------------
class InstanceMetricsResponse(BaseModel):
    id: str
    instance_id: str
    cpu_utilization_pct: float
    memory_utilization_pct: float
    disk_read_bytes_sec: float
    network_in_bytes_sec: float
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)


# -----------------------------
# Audit Log Schemas
# -----------------------------
class AuditLogResponse(BaseModel):
    id: str
    user_id: Optional[str] = None
    user_email: str
    action: str
    target_resource: str
    status: str
    ip_address: Optional[str] = None
    details: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
