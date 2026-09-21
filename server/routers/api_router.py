from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from server.database import get_db
from server.models.health_log_model import HealthLog
from server.schemas.api_schema import (
    ApiCreate,
    ApiUpdate,
    ApiSummary,
    ApiDetail,
)
from server.schemas.health_log_schema import HealthLogResponse, HealthLogList
from server.schemas.metrics_schema import MetricsSummary
from server.services.api_service import api_service
from server.services.health_poller import health_poller
from server.services.metrics_service import metrics_service

router = APIRouter(prefix="/apis", tags=["APIs"])


@router.get("", response_model=list[ApiSummary])
def list_apis(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
):
    """List all registered API endpoints with their current operational status."""
    return api_service.list_apis(db, skip=skip, limit=limit)


@router.post("", response_model=ApiDetail, status_code=status.HTTP_201_CREATED)
def create_api(
    api_in: ApiCreate,
    db: Session = Depends(get_db),
):
    """Register a new API endpoint for monitoring."""
    api = api_service.create_api(db, api_in)
    stats = metrics_service.get_api_24h_stats(db, api.id)
    return ApiDetail.from_orm_custom(api, stats)


@router.get("/{api_id}", response_model=ApiDetail)
def get_api(
    api_id: str,
    db: Session = Depends(get_db),
):
    """Retrieve detailed configuration and 24h summary metrics for an API."""
    api = api_service.get_api_by_id(db, api_id)
    if not api:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"API endpoint with ID {api_id} not found",
        )
    stats = metrics_service.get_api_24h_stats(db, api.id)
    return ApiDetail.from_orm_custom(api, stats)


@router.put("/{api_id}", response_model=ApiDetail)
def update_api(
    api_id: str,
    api_in: ApiUpdate,
    db: Session = Depends(get_db),
):
    """Update API monitoring parameters or toggle active status."""
    api = api_service.update_api(db, api_id, api_in)
    if not api:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"API endpoint with ID {api_id} not found",
        )
    stats = metrics_service.get_api_24h_stats(db, api.id)
    return ApiDetail.from_orm_custom(api, stats)


@router.delete("/{api_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_api(
    api_id: str,
    db: Session = Depends(get_db),
):
    """Delete an API and its associated historical health logs."""
    deleted = api_service.delete_api(db, api_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"API endpoint with ID {api_id} not found",
        )
    return None


@router.post("/{api_id}/check", response_model=HealthLogResponse)
async def trigger_manual_check(
    api_id: str,
    db: Session = Depends(get_db),
):
    """Trigger an immediate on-demand health check for an API."""
    api = api_service.get_api_by_id(db, api_id)
    if not api:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"API endpoint with ID {api_id} not found",
        )
    log = await health_poller.probe_endpoint(api, db)
    return HealthLogResponse.from_orm_custom(log, api_name=api.name)


@router.get("/{api_id}/logs", response_model=HealthLogList)
def get_api_logs(
    api_id: str,
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    status_filter: str = Query("all", description="all, failures, healthy, degraded"),
    db: Session = Depends(get_db),
):
    """Query paginated historical health logs for a specific API."""
    api = api_service.get_api_by_id(db, api_id)
    if not api:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"API endpoint with ID {api_id} not found",
        )

    query = db.query(HealthLog).filter(HealthLog.api_id == api_id)
    if status_filter.lower() == "failures":
        query = query.filter(HealthLog.is_success == False)  # noqa: E712
    elif status_filter.lower() == "healthy":
        query = query.filter(HealthLog.operational_status == "Healthy")
    elif status_filter.lower() == "degraded":
        query = query.filter(HealthLog.operational_status == "Degraded")

    total = query.count()
    items = query.order_by(desc(HealthLog.checked_at)).offset(offset).limit(limit).all()

    return HealthLogList(
        items=[
            HealthLogResponse.from_orm_custom(item, api_name=api.name) for item in items
        ],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.get("/{api_id}/metrics", response_model=MetricsSummary)
def get_api_metrics(
    api_id: str,
    timeframe: str = Query("24h", description="24h, 7d, 30d"),
    db: Session = Depends(get_db),
):
    """Retrieve time-series aggregated latency and uptime metrics."""
    api = api_service.get_api_by_id(db, api_id)
    if not api:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"API endpoint with ID {api_id} not found",
        )
    return metrics_service.get_api_metrics(db, api_id, timeframe=timeframe)
