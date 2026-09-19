from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from server.database import get_db
from server.models import User
from server.schemas import DashboardMetrics
from server.auth import get_current_user
from server.services.analytics_service import get_dashboard_metrics

router = APIRouter(prefix="/api/v1/analytics", tags=["Analytics"])


@router.get("/dashboard", response_model=DashboardMetrics)
def get_dashboard(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    return get_dashboard_metrics(db)
