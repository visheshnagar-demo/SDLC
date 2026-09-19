from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from server.database import get_db
from server.schemas import DashboardAnalyticsResponse
from server.services.analytics_service import get_dashboard_metrics

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/dashboard", response_model=DashboardAnalyticsResponse)
def get_dashboard(db: Session = Depends(get_db)):
    metrics = get_dashboard_metrics(db)
    return metrics
