import json
from datetime import datetime
from typing import Optional, Any
from pydantic import BaseModel, Field, field_validator


class ApiBase(BaseModel):
    name: str = Field(
        ..., min_length=1, max_length=120, description="Name of the API endpoint"
    )
    target_url: str = Field(
        ..., description="Target URL to probe (http:// or https://)"
    )
    http_method: str = Field("GET", description="HTTP method: GET, POST, or HEAD")
    interval_seconds: int = Field(
        60,
        ge=1,
        le=3600,
        description="Monitoring interval in seconds (e.g. 30, 60, 300)",
    )
    expected_status: int = Field(
        200, ge=100, le=599, description="Expected HTTP response status code"
    )
    timeout_seconds: float = Field(
        5.0, ge=0.1, le=60.0, description="Timeout threshold in seconds"
    )
    request_headers: Optional[dict[str, str]] = Field(
        None, description="Custom request headers as key-value pairs"
    )
    request_body: Optional[str] = Field(
        None, description="Optional request body payload"
    )
    is_active: bool = Field(True, description="Whether monitoring is active")

    @field_validator("target_url")
    @classmethod
    def validate_url(cls, v: str) -> str:
        v = v.strip()
        if not (v.startswith("http://") or v.startswith("https://")):
            raise ValueError("Target URL must start with http:// or https://")
        return v

    @field_validator("http_method")
    @classmethod
    def validate_method(cls, v: str) -> str:
        v = v.strip().upper()
        if v not in ("GET", "POST", "HEAD"):
            raise ValueError("HTTP method must be GET, POST, or HEAD")
        return v


class ApiCreate(ApiBase):
    pass


class ApiUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=120)
    target_url: Optional[str] = None
    http_method: Optional[str] = None
    interval_seconds: Optional[int] = Field(None, ge=1, le=3600)
    expected_status: Optional[int] = Field(None, ge=100, le=599)
    timeout_seconds: Optional[float] = Field(None, ge=0.1, le=60.0)
    request_headers: Optional[dict[str, str]] = None
    request_body: Optional[str] = None
    is_active: Optional[bool] = None

    @field_validator("target_url")
    @classmethod
    def validate_url(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            v = v.strip()
            if not (v.startswith("http://") or v.startswith("https://")):
                raise ValueError("Target URL must start with http:// or https://")
        return v

    @field_validator("http_method")
    @classmethod
    def validate_method(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            v = v.strip().upper()
            if v not in ("GET", "POST", "HEAD"):
                raise ValueError("HTTP method must be GET, POST, or HEAD")
        return v


class ApiSummary(BaseModel):
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


class ApiStats24h(BaseModel):
    uptime_pct: float = 100.0
    avg_latency_ms: float = 0.0
    total_probes: int = 0
    failure_count: int = 0


class ApiDetail(BaseModel):
    id: str
    name: str
    target_url: str
    http_method: str
    interval_seconds: int
    expected_status: int
    timeout_seconds: float
    request_headers: Optional[dict[str, Any]] = None
    request_body: Optional[str] = None
    is_active: bool
    current_status: str
    last_latency_ms: Optional[float] = None
    last_checked_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    stats_24h: Optional[ApiStats24h] = None

    class Config:
        from_attributes = True

    @classmethod
    def from_orm_custom(
        cls, api: Any, stats: Optional[ApiStats24h] = None
    ) -> "ApiDetail":
        headers = None
        if api.request_headers:
            if isinstance(api.request_headers, dict):
                headers = api.request_headers
            elif isinstance(api.request_headers, str):
                try:
                    headers = json.loads(api.request_headers)
                except Exception:
                    headers = {}

        return cls(
            id=api.id,
            name=api.name,
            target_url=api.target_url,
            http_method=api.http_method,
            interval_seconds=api.interval_seconds,
            expected_status=api.expected_status,
            timeout_seconds=api.timeout_seconds,
            request_headers=headers,
            request_body=api.request_body,
            is_active=api.is_active,
            current_status=api.current_status,
            last_latency_ms=api.last_latency_ms,
            last_checked_at=api.last_checked_at,
            created_at=api.created_at,
            updated_at=api.updated_at,
            stats_24h=stats,
        )
