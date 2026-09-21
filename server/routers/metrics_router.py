from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from server.database import get_db
from server.schemas.metrics_schema import MetricsSummary
from server.services.api_service import get_api_by_id
from server.services.metrics_service import compute_api_metrics

router = APIRouter(prefix="/apis", tags=["Metrics"])


@router.get("/{api_id}/metrics", response_model=MetricsSummary)
def get_api_metrics(
    api_id: str,
    timeframe: str = Query(
        "24h", description="Aggregation timeframe: '24h', '7d', or '30d'"
    ),
    db: Session = Depends(get_db),
):
    """Retrieve time-series aggregated latency and uptime metrics for an API."""
    api_obj = get_api_by_id(db, api_id)
    if not api_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Monitored API with ID '{api_id}' was not found",
        )

    tf = timeframe.lower().strip()
    if tf not in ("24h", "7d", "30d"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid timeframe parameter. Must be one of: '24h', '7d', '30d'",
        )

    metrics = compute_api_metrics(db, api_id, timeframe=tf)
    return metrics
