from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from server.database import get_db
from server.models import User
from server.schemas import DashboardAnalyticsResponse
from server.auth import get_current_support_or_admin_user
from server.services.analytics_service import get_dashboard_analytics

router = APIRouter(prefix="/api/v1/analytics", tags=["Analytics & Metrics"])


@router.get("/dashboard", response_model=DashboardAnalyticsResponse)
def get_dashboard_metrics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_support_or_admin_user),
):
    return get_dashboard_analytics(db=db)
