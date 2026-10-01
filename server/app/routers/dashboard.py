"""Dashboard and analytics router."""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from server.app.database import get_db
from server.app import models, schemas
from server.app.services import dashboard_service

router = APIRouter(prefix="/api/v1/dashboard", tags=["Dashboard"])


@router.get("/weekly", response_model=schemas.WeeklyDashboardResponse)
def get_weekly_dashboard_endpoint(
    child_id: Optional[str] = Query(None, description="Child profile UUID"),
    db: Session = Depends(get_db),
):
    if not child_id:
        first_child = db.query(models.Child).first()
        if not first_child:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No child profile found. Please create a child profile first.",
            )
        child_id = first_child.id

    return dashboard_service.get_weekly_dashboard(db, child_id)
