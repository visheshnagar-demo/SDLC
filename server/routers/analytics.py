from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from server import crud, schemas
from server.database import get_db

router = APIRouter(prefix="/api/v1/analytics", tags=["Analytics & Dashboard"])


@router.get("/dashboard", response_model=schemas.DashboardAnalyticsResponse)
def get_dashboard_analytics(db: Session = Depends(get_db)):
    """Retrieve summary KPI metrics, low-stock warnings, and revenue analytics."""
    return crud.get_dashboard_analytics(db)
