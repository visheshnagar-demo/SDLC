from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from server import crud, schemas
from server.database import get_db

router = APIRouter(prefix="/api/v1/analytics", tags=["Analytics"])


@router.get("/dashboard", response_model=schemas.DashboardAnalytics)
def get_dashboard_analytics(db: Session = Depends(get_db)):
    return crud.get_dashboard_analytics(db)
