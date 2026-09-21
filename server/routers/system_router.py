import datetime
from fastapi import APIRouter

router = APIRouter(tags=["System"])


@router.get("/health")
def health_check():
    """Service liveness and readiness probe."""
    return {
        "status": "ok",
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "service": "api-health-monitoring-service",
    }
