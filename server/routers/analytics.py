from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from server.database import get_db
from server.schemas import DashboardAnalyticsResponse
from server.services.audit_service import get_dashboard_analytics

router = APIRouter(prefix="/api/v1/analytics", tags=["Analytics & Dashboard"])


@router.get("/dashboard", response_model=DashboardAnalyticsResponse)
def get_dashboard_metrics(db: Session = Depends(get_db)):
    return get_dashboard_analytics(db)
