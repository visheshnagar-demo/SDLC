from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from server.database import get_db
from server.models import User
from server.schemas import DashboardAnalytics
from server.auth import get_current_support_or_admin
from server.services import analytics_service

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/dashboard", response_model=DashboardAnalytics)
def get_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_support_or_admin),
):
    return analytics_service.get_dashboard_analytics(db)
