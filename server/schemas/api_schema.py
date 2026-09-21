from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field, field_validator


class APICreate(BaseModel):
    name: str = Field(
        ...,
        min_length=1,
        max_length=120,
        description="Human-readable name of the API endpoint",
    )
    target_url: str = Field(
        ..., min_length=4, max_length=1024, description="Target URL to probe"
    )
    http_method: str = Field(
        default="GET", description="HTTP method to use: GET, POST, or HEAD"
    )
    interval_seconds: int = Field(
        default=60,
        ge=5,
        le=86400,
        description="Probe interval in seconds (e.g., 30, 60, 300)",
    )
    expected_status: int = Field(
        default=200, ge=100, le=599, description="Expected HTTP response status code"
    )
    timeout_seconds: float = Field(
        default=5.0, ge=0.1, le=60.0, description="Timeout threshold in seconds"
    )
    request_headers: Optional[Dict[str, Any]] = Field(
        default=None, description="Custom request headers as key-value pairs"
    )
    request_body: Optional[str] = Field(
        default=None, description="Optional request body payload for POST probes"
    )
    is_active: bool = Field(
        default=True, description="Whether active monitoring is enabled"
    )

    @field_validator("http_method")
    @classmethod
    def validate_method(cls, v: str) -> str:
        upper = v.strip().upper()
        if upper not in ("GET", "POST", "HEAD"):
            raise ValueError("HTTP method must be one of: GET, POST, HEAD")
        return upper

    @field_validator("target_url")
    @classmethod
    def validate_url(cls, v: str) -> str:
        v_clean = v.strip()
        if not (v_clean.startswith("http://") or v_clean.startswith("https://")):
            raise ValueError("Target URL must start with http:// or https://")
        return v_clean


class APIUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=120)
    target_url: Optional[str] = Field(default=None, min_length=4, max_length=1024)
    http_method: Optional[str] = Field(default=None)
    interval_seconds: Optional[int] = Field(default=None, ge=5, le=86400)
    expected_status: Optional[int] = Field(default=None, ge=100, le=599)
    timeout_seconds: Optional[float] = Field(default=None, ge=0.1, le=60.0)
    request_headers: Optional[Dict[str, Any]] = None
    request_body: Optional[str] = None
    is_active: Optional[bool] = None

    @field_validator("http_method")
    @classmethod
    def validate_method(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        upper = v.strip().upper()
        if upper not in ("GET", "POST", "HEAD"):
            raise ValueError("HTTP method must be one of: GET, POST, HEAD")
        return upper

    @field_validator("target_url")
    @classmethod
    def validate_url(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        v_clean = v.strip()
        if not (v_clean.startswith("http://") or v_clean.startswith("https://")):
            raise ValueError("Target URL must start with http:// or https://")
        return v_clean


class APISummary(BaseModel):
    id: str
    name: str
    target_url: str
    http_method: str
    interval_seconds: int
    is_active: bool
    current_status: str
    last_latency_ms: Optional[float] = None
    last_checked_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class APIDetail(BaseModel):
    id: str
    name: str
    target_url: str
    http_method: str
    interval_seconds: int
    expected_status: int
    timeout_seconds: float
    request_headers: Optional[Dict[str, Any]] = None
    request_body: Optional[str] = None
    is_active: bool
    current_status: str
    last_latency_ms: Optional[float] = None
    last_checked_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    stats_24h: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True
