import json
from datetime import datetime
from typing import Optional, Any
from pydantic import BaseModel


class HealthLogResponse(BaseModel):
    id: str
    api_id: str
    response_status: Optional[int] = None
    latency_ms: float
    operational_status: str
    is_success: bool
    error_message: Optional[str] = None
    request_headers: Optional[dict[str, Any]] = None
    response_body: Optional[str] = None
    checked_at: datetime
    api_name: Optional[str] = None

    class Config:
        from_attributes = True

    @classmethod
    def from_orm_custom(
        cls, log: Any, api_name: Optional[str] = None
    ) -> "HealthLogResponse":
        headers = None
        if log.request_headers:
            if isinstance(log.request_headers, dict):
                headers = log.request_headers
            elif isinstance(log.request_headers, str):
                try:
                    headers = json.loads(log.request_headers)
                except Exception:
                    headers = {}

        return cls(
            id=log.id,
            api_id=log.api_id,
            response_status=log.response_status,
            latency_ms=log.latency_ms,
            operational_status=log.operational_status,
            is_success=log.is_success,
            error_message=log.error_message,
            request_headers=headers,
            response_body=log.response_body,
            checked_at=log.checked_at,
            api_name=api_name or (log.api.name if getattr(log, "api", None) else None),
        )


class HealthLogList(BaseModel):
    items: list[HealthLogResponse]
    total: int
    limit: int
    offset: int
