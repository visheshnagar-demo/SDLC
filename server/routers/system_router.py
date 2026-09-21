from datetime import datetime, timezone, timedelta
from typing import Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from server.database import get_db
from server.models.api_model import APIModel
from server.models.health_log_model import HealthLogModel

router = APIRouter(tags=["System & Summary"])


@router.get("/health")
def health_check(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """Service liveness and database readiness health check."""
    db_status = "connected"
    try:
        db.execute(text("SELECT 1"))
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"

    return {
        "status": "ok" if db_status == "connected" else "degraded",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "database": db_status,
        "service": "API Health Monitoring Dashboard",
    }


@router.get("/summary")
def get_dashboard_summary(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """Get high-level summary KPI metrics for the entire dashboard."""
    now = datetime.now(timezone.utc)
    cutoff_24h = now - timedelta(hours=24)

    total_apis = db.query(APIModel).count()
    active_apis = db.query(APIModel).filter(APIModel.is_active.is_(True)).count()
    healthy_apis = (
        db.query(APIModel).filter(APIModel.current_status == "Healthy").count()
    )
    degraded_apis = (
        db.query(APIModel).filter(APIModel.current_status == "Degraded").count()
    )
    down_apis = db.query(APIModel).filter(APIModel.current_status == "Down").count()

    # 24-hour global log stats
    logs_24h = (
        db.query(HealthLogModel).filter(HealthLogModel.checked_at >= cutoff_24h).all()
    )
    total_checks = len(logs_24h)
    successful_checks = len([l for l in logs_24h if l.is_success])
    failure_checks = total_checks - successful_checks

    overall_uptime = (
        round((successful_checks / total_checks) * 100.0, 2)
        if total_checks > 0
        else 100.0
    )
    avg_latency = (
        round(sum(l.latency_ms for l in logs_24h) / total_checks, 2)
        if total_checks > 0
        else 0.0
    )

    return {
        "total_apis": total_apis,
        "active_apis": active_apis,
        "healthy_apis": healthy_apis,
        "degraded_apis": degraded_apis,
        "down_apis": down_apis,
        "active_failures": down_apis,
        "overall_uptime_pct": overall_uptime,
        "average_latency_ms": avg_latency,
        "total_checks_24h": total_checks,
        "failure_checks_24h": failure_checks,
    }
