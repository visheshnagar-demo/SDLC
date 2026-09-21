import datetime
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from server.database import get_db
from server.models.api_model import ApiEndpoint
from server.models.health_log_model import HealthLog

router = APIRouter(prefix="/metrics", tags=["Metrics"])


class GlobalSummary(BaseModel):
    total_apis: int
    active_apis: int
    healthy_apis: int
    degraded_apis: int
    down_apis: int
    active_failures: int
    avg_latency_ms: float
    overall_uptime_pct: float


@router.get("/summary", response_model=GlobalSummary)
def get_global_metrics_summary(db: Session = Depends(get_db)):
    """Retrieve global health overview metrics for the dashboard header cards."""
    apis = db.query(ApiEndpoint).all()
    total_apis = len(apis)
    active_apis = sum(1 for a in apis if a.is_active)
    healthy_apis = sum(1 for a in apis if a.current_status == "Healthy")
    degraded_apis = sum(1 for a in apis if a.current_status == "Degraded")
    down_apis = sum(1 for a in apis if a.current_status == "Down")

    now = datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None)
    since_24h = now - datetime.timedelta(hours=24)
    logs_24h = db.query(HealthLog).filter(HealthLog.checked_at >= since_24h).all()

    total_probes = len(logs_24h)
    if total_probes > 0:
        failures = sum(1 for l in logs_24h if not l.is_success)
        uptime_pct = round(((total_probes - failures) / total_probes) * 100, 2)
        avg_latency = round(sum(l.latency_ms for l in logs_24h) / total_probes, 2)
    else:
        uptime_pct = 100.0
        avg_latency = 0.0

    return GlobalSummary(
        total_apis=total_apis,
        active_apis=active_apis,
        healthy_apis=healthy_apis,
        degraded_apis=degraded_apis,
        down_apis=down_apis,
        active_failures=down_apis,
        avg_latency_ms=avg_latency,
        overall_uptime_pct=uptime_pct,
    )
