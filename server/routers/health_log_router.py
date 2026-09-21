from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from server.database import get_db
from server.models.api_model import APIModel
from server.models.health_log_model import HealthLogModel
from server.schemas.health_log_schema import HealthLogResponse, FailureLogResponse
from server.services.api_service import get_api_by_id

router = APIRouter(tags=["Health Logs & Failures"])


@router.get("/apis/{api_id}/logs", response_model=List[HealthLogResponse])
def get_api_logs(
    api_id: str,
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    status_filter: Optional[str] = Query(
        "all",
        description="Filter by status: 'all', 'failures', 'healthy', 'degraded', 'down'",
    ),
    db: Session = Depends(get_db),
):
    """Query paginated historical health logs for a specific API endpoint."""
    api_obj = get_api_by_id(db, api_id)
    if not api_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Monitored API with ID '{api_id}' was not found",
        )

    query = db.query(HealthLogModel).filter(HealthLogModel.api_id == api_id)

    if status_filter:
        s_filter = status_filter.lower().strip()
        if s_filter == "failures":
            query = query.filter(HealthLogModel.is_success.is_(False))
        elif s_filter in ("healthy", "degraded", "down"):
            query = query.filter(HealthLogModel.operational_status.ilike(s_filter))

    logs = (
        query.order_by(HealthLogModel.checked_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )
    return [HealthLogResponse.model_validate(l) for l in logs]


@router.get("/failures", response_model=List[FailureLogResponse])
def get_global_failures(
    limit: int = Query(20, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    """Retrieve global recent failure logs across all monitored APIs with API metadata."""
    query = (
        db.query(HealthLogModel, APIModel)
        .join(APIModel, HealthLogModel.api_id == APIModel.id)
        .filter(HealthLogModel.is_success.is_(False))
        .order_by(HealthLogModel.checked_at.desc())
        .offset(offset)
        .limit(limit)
    )

    results = []
    for log, api in query.all():
        item = FailureLogResponse(
            id=log.id,
            api_id=log.api_id,
            api_name=api.name,
            target_url=api.target_url,
            http_method=api.http_method,
            response_status=log.response_status,
            latency_ms=log.latency_ms,
            operational_status=log.operational_status,
            is_success=log.is_success,
            error_message=log.error_message,
            request_headers=log.request_headers,
            response_body=log.response_body,
            checked_at=log.checked_at,
        )
        results.append(item)
    return results
