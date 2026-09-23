"""Health check endpoint router."""

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from server.database import get_db

router = APIRouter(prefix="/api/v1/health", tags=["Health"])


@router.get("", status_code=status.HTTP_200_OK)
def health_check(db: Session = Depends(get_db)):
    """Health and readiness check."""
    db_status = "connected"
    try:
        db.execute(text("SELECT 1"))
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"

    return {
        "status": "healthy" if db_status == "connected" else "degraded",
        "service": "ai-study-planner",
        "version": "1.0.0",
        "database": db_status,
    }
