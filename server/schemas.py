"""Pydantic schemas for request and response validation."""

from datetime import datetime
from typing import Optional, List, Any, Dict
from pydantic import BaseModel, ConfigDict


# --- Auth & User Schemas ---
class UserLogin(BaseModel):
    username: Optional[str] = None
    email: Optional[str] = None
    password: str


class UserCreate(BaseModel):
    email: str
    password: str
    full_name: str
    role: str = "READ_ONLY"  # "ADMIN" or "READ_ONLY"


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    email: str
    full_name: str
    role: str
    is_active: bool
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    user_id: str


class TokenData(BaseModel):
    user_id: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None


# --- Cloud Provider Schemas ---
class CloudProviderCreate(BaseModel):
    name: str
    provider_type: str  # 'AWS', 'GCP', 'AZURE'
    credentials: Optional[Dict[str, Any]] = None


class CloudProviderOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    provider_type: str
    is_active: bool
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


# --- Cloud Instance Schemas ---
class CloudInstanceCreate(BaseModel):
    provider_id: str
    name: str
    region: str
    instance_type: str
    image_id: Optional[str] = "ubuntu-2204-lts"


class CloudInstanceActionRequest(BaseModel):
    action: str  # 'START', 'STOP', 'RESTART', 'TERMINATE'


class CloudInstanceActionResponse(BaseModel):
    instance_id: str
    action: str
    previous_status: str
    current_status: str
    message: Optional[str] = None


class CloudInstanceOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    provider_id: str
    external_instance_id: str
    name: str
    region: str
    instance_type: str
    status: str
    public_ip: Optional[str] = None
    private_ip: Optional[str] = None
    launch_time: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class ProvisionResponse(BaseModel):
    instance_id: str
    id: Optional[str] = None
    status: str
    message: str


# --- Instance Metrics Schemas ---
class InstanceMetricOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: Optional[str] = None
    instance_id: str
    timestamp: datetime
    cpu_utilization_pct: float
    memory_utilization_pct: float
    disk_read_bytes_sec: int = 0
    network_in_bytes_sec: int = 0


class InstanceMetricsResponse(BaseModel):
    instance_id: str
    metrics: List[InstanceMetricOut]


# --- Audit Log Schemas ---
class AuditLogOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: Optional[str] = None
    user_email: str
    action: str
    target_resource: str
    status: str
    details: Optional[str] = None
    ip_address: Optional[str] = None
    created_at: datetime
