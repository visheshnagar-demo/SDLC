from datetime import date, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from server.database import get_db
from server.models import Flock, EggCollection, FeedInventory, HealthMortalityLog
from server.schemas import DashboardAnalyticsResponse

router = APIRouter(prefix="/analytics", tags=["Farm Analytics"])


@router.get("/dashboard", response_model=DashboardAnalyticsResponse)
def get_dashboard_analytics(db: Session = Depends(get_db)):
    active_flocks = db.query(Flock).filter(Flock.status == "ACTIVE").all()
    total_active_flocks = len(active_flocks)
    total_active_hens = sum(f.active_count for f in active_flocks)

    today = date.today()
    today_sum = (
        db.query(func.sum(EggCollection.total_count))
        .filter(EggCollection.collection_date == today)
        .scalar()
    )

    if today_sum is None:
        latest_date = db.query(func.max(EggCollection.collection_date)).scalar()
        if latest_date:
            today_egg_total = (
                db.query(func.sum(EggCollection.total_count))
                .filter(EggCollection.collection_date == latest_date)
                .scalar()
                or 0
            )
        else:
            today_egg_total = 0
    else:
        today_egg_total = today_sum

    if total_active_hens == 0:
        overall_laying_rate_pct = 0.0
    else:
        overall_laying_rate_pct = round(
            (today_egg_total / total_active_hens) * 100.0, 2
        )

    low_stock_items = (
        db.query(FeedInventory)
        .filter(FeedInventory.quantity_kg < FeedInventory.reorder_threshold_kg)
        .all()
    )

    low_stock_alerts = [
        {
            "id": item.id,
            "feed_type": item.feed_type,
            "quantity_kg": item.quantity_kg,
            "reorder_threshold_kg": item.reorder_threshold_kg,
        }
        for item in low_stock_items
    ]

    seven_days_ago = today - timedelta(days=7)
    recent_health_events_count = (
        db.query(HealthMortalityLog)
        .filter(HealthMortalityLog.log_date >= seven_days_ago)
        .count()
    )

    return DashboardAnalyticsResponse(
        total_active_flocks=total_active_flocks,
        total_active_hens=total_active_hens,
        today_egg_total=today_egg_total,
        overall_laying_rate_pct=overall_laying_rate_pct,
        low_stock_alerts=low_stock_alerts,
        recent_health_events_count=recent_health_events_count,
    )
