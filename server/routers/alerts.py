from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from server.database import get_db
from server.schemas.alerts import (
    AlertListResponse,
    AlertDetailResponse,
    AlertStatusUpdateRequest,
    AlertStatsResponse,
)
from server.services.alerts import (
    list_alerts,
    get_alert_by_id,
    update_alert_status,
    get_alert_stats,
)

router = APIRouter(prefix="/alerts", tags=["Alerts"])


@router.get(
    "",
    response_model=AlertListResponse,
    summary="List paginated alerts with status, severity, and account filtering",
)
def get_alerts(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    status: Optional[str] = Query(None),
    severity: Optional[str] = Query(None),
    account_id: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    total, items = list_alerts(
        db=db,
        status=status,
        severity=severity,
        account_id=account_id,
        search=search,
        skip=skip,
        limit=limit,
    )
    return AlertListResponse(total=total, skip=skip, limit=limit, items=items)


@router.get(
    "/stats",
    response_model=AlertStatsResponse,
    summary="Get alert operational statistics for KPI cards",
)
def get_stats(db: Session = Depends(get_db)):
    return get_alert_stats(db)


@router.get(
    "/{id}",
    response_model=AlertDetailResponse,
    summary="Get detailed investigation breakdown of an alert",
)
def get_alert_details(
    id: str,
    db: Session = Depends(get_db),
):
    return get_alert_by_id(db=db, alert_id=id)


@router.patch(
    "/{id}/status",
    response_model=AlertDetailResponse,
    summary="Update alert investigation status and record audit log",
)
def update_status(
    id: str,
    body: AlertStatusUpdateRequest,
    db: Session = Depends(get_db),
):
    return update_alert_status(db=db, alert_id=id, req=body)
