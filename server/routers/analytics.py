from datetime import date, timedelta
from typing import List, Dict
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import func
from sqlalchemy.orm import Session
from server.database import get_db
from server.models import Cow, MilkYieldLog, User
from server.schemas import AnalyticsSummaryResponse, YieldTrendPoint
from server.auth import get_current_user

router = APIRouter(prefix="/analytics", tags=["Analytics & KPIs"])


@router.get(
    "/summary",
    response_model=AnalyticsSummaryResponse,
    status_code=status.HTTP_200_OK,
    summary="Retrieve KPI metrics and status distribution summary",
)
def get_analytics_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    total_cows = db.query(Cow).count()

    # Lactating cows: female cows that are not 'Dry'
    lactating_cows = (
        db.query(Cow).filter(Cow.gender == "Female", Cow.health_status != "Dry").count()
    )

    today = date.today()
    # Today's milk yield
    today_yield = (
        db.query(func.sum(MilkYieldLog.total_yield_liters))
        .filter(MilkYieldLog.logging_date == today)
        .scalar()
    ) or 0.0

    # Active health alerts: cows not Healthy or yield drop alerts
    status_counts = (
        db.query(Cow.health_status, func.count(Cow.id))
        .group_by(Cow.health_status)
        .all()
    )
    status_breakdown: Dict[str, int] = {
        "Healthy": 0,
        "Under Treatment": 0,
        "Sick": 0,
        "Quarantined": 0,
        "Dry": 0,
    }
    active_health_alerts = 0
    for s_name, count in status_counts:
        status_breakdown[s_name] = count
        if s_name in ["Under Treatment", "Sick", "Quarantined"]:
            active_health_alerts += count

    recent_drop_alerts = (
        db.query(MilkYieldLog)
        .filter(
            MilkYieldLog.yield_drop_alert == True,
            MilkYieldLog.logging_date >= today - timedelta(days=7),
        )
        .count()
    )
    active_health_alerts += recent_drop_alerts

    return AnalyticsSummaryResponse(
        total_cows=total_cows,
        lactating_cows=lactating_cows,
        today_total_yield_liters=round(float(today_yield), 2),
        active_health_alerts=active_health_alerts,
        status_breakdown=status_breakdown,
    )


@router.get(
    "/yield-trends",
    response_model=List[YieldTrendPoint],
    status_code=status.HTTP_200_OK,
    summary="Retrieve aggregate milk production trend series",
)
def get_yield_trends(
    days: int = Query(30, ge=1, le=90, description="Number of historical days"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    today = date.today()
    start_date = today - timedelta(days=days - 1)

    daily_aggregates = (
        db.query(
            MilkYieldLog.logging_date,
            func.sum(MilkYieldLog.total_yield_liters).label("total_yield"),
            func.count(MilkYieldLog.id).label("log_count"),
        )
        .filter(MilkYieldLog.logging_date >= start_date)
        .group_by(MilkYieldLog.logging_date)
        .order_by(MilkYieldLog.logging_date.asc())
        .all()
    )

    agg_map = {
        row.logging_date: (float(row.total_yield), int(row.log_count))
        for row in daily_aggregates
    }

    results: List[YieldTrendPoint] = []
    current_d = start_date
    while current_d <= today:
        if current_d in agg_map:
            total_y, count = agg_map[current_d]
            avg_per_cow = round(total_y / count, 2) if count > 0 else 0.0
            results.append(
                YieldTrendPoint(
                    date=current_d.isoformat(),
                    total_yield=round(total_y, 2),
                    average_per_cow=avg_per_cow,
                )
            )
        else:
            results.append(
                YieldTrendPoint(
                    date=current_d.isoformat(),
                    total_yield=0.0,
                    average_per_cow=0.0,
                )
            )
        current_d += timedelta(days=1)

    return results
