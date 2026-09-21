from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel


class HealthLogResponse(BaseModel):
    id: str
    api_id: str
    response_status: Optional[int] = None
    latency_ms: float
    operational_status: str
    is_success: bool
    error_message: Optional[str] = None
    request_headers: Optional[Dict[str, Any]] = None
    response_body: Optional[str] = None
    checked_at: datetime

    class Config:
        from_attributes = True


class FailureLogResponse(BaseModel):
    id: str
    api_id: str
    api_name: Optional[str] = None
    target_url: Optional[str] = None
    http_method: Optional[str] = None
    response_status: Optional[int] = None
    latency_ms: float
    operational_status: str
    is_success: bool
    error_message: Optional[str] = None
    request_headers: Optional[Dict[str, Any]] = None
    response_body: Optional[str] = None
    checked_at: datetime

    class Config:
        from_attributes = True
