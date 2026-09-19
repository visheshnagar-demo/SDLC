from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from server.database import get_db
from server.models import Channel, EmergencyOverride, User
from server.schemas import DashboardMetricsResponse
from server.auth import get_current_user

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/metrics", response_model=DashboardMetricsResponse)
def get_dashboard_metrics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    total_channels = db.query(Channel).count()
    active_channels = db.query(Channel).filter(Channel.status == "ACTIVE").count()

    active_emergencies = (
        db.query(EmergencyOverride).filter(EmergencyOverride.is_active == True).count()  # noqa: E712
    )

    channels_str = (
        f"{active_channels} / {total_channels}" if total_channels > 0 else "0 / 0"
    )

    return DashboardMetricsResponse(
        active_channels=channels_str,
        concurrent_viewers="1.24M",
        transmission_health_pct=99.98,
        active_emergency_alerts=active_emergencies,
    )
