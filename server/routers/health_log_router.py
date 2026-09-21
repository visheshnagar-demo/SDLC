from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from server.database import get_db
from server.schemas.health_log_schema import HealthLogResponse
from server.services.metrics_service import metrics_service

router = APIRouter(tags=["Failures"])


@router.get("/failures", response_model=list[HealthLogResponse])
def get_recent_failures(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    """Retrieve global recent failure logs across all monitored APIs."""
    items, _ = metrics_service.get_global_failures(db, limit=limit, offset=offset)
    return [HealthLogResponse.from_orm_custom(item) for item in items]
