from datetime import date, datetime, timedelta, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from server.database import get_db
from server.models import Cattle, MilkLog, HealthRecord, FeedInventory
from server.schemas import DashboardAnalyticsOut, LactationCurvePoint, AlertItem

router = APIRouter(
    prefix="/api/v1/analytics", tags=["Herd Analytics & Executive Dashboard"]
)


def to_utc(dt: Optional[datetime]) -> Optional[datetime]:
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


@router.get("/dashboard", response_model=DashboardAnalyticsOut)
def get_dashboard_analytics(
    target_date: Optional[date] = Query(None),
    db: Session = Depends(get_db),
):
    """Aggregate executive farm KPIs, 7-day rolling yield curves, fertility rates, and active alerts."""
    now = datetime.now(timezone.utc)
    ref_date = target_date or date.today()

    # 1. Cattle distribution
    all_cattle = db.query(Cattle).all()
    total_cows = len(all_cattle)
    active_cows = [c for c in all_cattle if c.status not in ("Culled", "Deceased")]
    active_cows_count = len(active_cows)
    lactating_cows = [
        c for c in all_cattle if c.status.lower() in ("lactating", "active")
    ]
    active_lactating_count = len(lactating_cows)
    dry_count = sum(1 for c in all_cattle if c.status.lower() == "dry")
    pregnant_count = sum(
        1 for c in all_cattle if c.status.lower() in ("pregnant", "confirmed pregnant")
    )
    culled_count = sum(1 for c in all_cattle if c.status.lower() == "culled")

    # Females eligible for breeding
    eligible_females = [
        c
        for c in all_cattle
        if c.gender.lower() == "female" and c.status not in ("Culled", "Deceased")
    ]
    fertility_rate = (
        (pregnant_count / len(eligible_females) * 100.0) if eligible_females else 0.0
    )

    culling_rate = (culled_count / total_cows * 100.0) if total_cows else 0.0

    # 2. Milk production calculations
    all_logs = db.query(MilkLog).all()

    # Determine reference date logs (or fallback to latest day if today has no logs)
    date_logs = [l for l in all_logs if l.milking_date == ref_date]
    if not date_logs and all_logs:
        latest_date = max(l.milking_date for l in all_logs)
        date_logs = [l for l in all_logs if l.milking_date == latest_date]
        effective_date = latest_date
    else:
        effective_date = ref_date

    total_daily_yield = sum(l.yield_liters for l in date_logs)
    logged_cows = set(l.cow_id for l in date_logs)
    avg_yield_per_cow = (total_daily_yield / len(logged_cows)) if logged_cows else 0.0

    # 7-day rolling yield calculation
    rolling_start = effective_date - timedelta(days=6)
    rolling_logs = [
        l for l in all_logs if rolling_start <= l.milking_date <= effective_date
    ]
    total_7d_yield = sum(l.yield_liters for l in rolling_logs)
    rolling_7d_daily_avg = (total_7d_yield / 7.0) if rolling_logs else 0.0

    # Lactation curve for past 7 days
    lactation_curve: List[LactationCurvePoint] = []
    for d_idx in range(7):
        curve_date = rolling_start + timedelta(days=d_idx)
        day_logs = [l for l in all_logs if l.milking_date == curve_date]
        day_total = sum(l.yield_liters for l in day_logs)
        day_cows = set(l.cow_id for l in day_logs)
        day_avg = (day_total / len(day_cows)) if day_cows else 0.0
        lactation_curve.append(
            LactationCurvePoint(
                date=curve_date.isoformat(),
                avg_yield_liters=round(day_avg, 2),
                total_yield_liters=round(day_total, 2),
            )
        )

    # 3. Feed Conversion Efficiency
    total_feed_consumption = db.query(FeedInventory).all()
    daily_dm_intake = sum(f.daily_consumption_kg for f in total_feed_consumption)
    if daily_dm_intake > 0:
        fce = (total_daily_yield * 1.03) / daily_dm_intake
    else:
        fce = 1.45

    # 4. Active Health Withholdings
    all_health_recs = (
        db.query(HealthRecord)
        .filter(HealthRecord.milk_withdrawal_end.isnot(None))
        .all()
    )
    active_withholding_records = [
        r
        for r in all_health_recs
        if to_utc(r.milk_withdrawal_end) is not None
        and to_utc(r.milk_withdrawal_end) > now
    ]
    withholding_cow_ids = set(r.cow_id for r in active_withholding_records)
    active_withholding_count = len(withholding_cow_ids)

    # 5. Check Data Incomplete Warning
    data_incomplete = False
    if active_lactating_count > 0:
        missing_count = active_lactating_count - len(logged_cows)
        if missing_count > (0.10 * active_lactating_count):
            data_incomplete = True

    # 6. Build Active Alerts List
    alerts: List[AlertItem] = []

    # Withdrawal alerts
    for h_rec in active_withholding_records:
        cow = h_rec.cow
        tag = cow.tag_number if cow else "Unknown"
        end_utc = to_utc(h_rec.milk_withdrawal_end)
        treat_utc = to_utc(h_rec.treatment_date) or now
        alerts.append(
            AlertItem(
                id=f"withholding-{h_rec.id}",
                type="active_withdrawal",
                severity="critical",
                title=f"Active Milk Withdrawal: {tag}",
                message=f"Cow {tag} treated with {h_rec.medication_administered or h_rec.diagnosis}. Milk withheld until {end_utc.strftime('%Y-%m-%d %H:%M UTC') if end_utc else 'N/A'}.",
                created_at=treat_utc.isoformat(),
            )
        )

    # Mastitis / Variance alerts from recent milk logs
    recent_variance_logs = (
        db.query(MilkLog)
        .filter(
            MilkLog.variance_alert == True,
            MilkLog.milking_date >= effective_date - timedelta(days=2),
        )
        .all()
    )
    for v_log in recent_variance_logs:
        cow = v_log.cow
        tag = cow.tag_number if cow else "Unknown"
        created_utc = to_utc(v_log.created_at) or now
        alerts.append(
            AlertItem(
                id=f"mastitis-{v_log.id}",
                type="mastitis_warning",
                severity="warning",
                title=f"Mastitis / Yield Drop Warning: {tag}",
                message=f"Cow {tag} yield dropped >30% on {v_log.milking_date} ({v_log.session}: {v_log.yield_liters}L). Check for clinical mastitis.",
                created_at=created_utc.isoformat(),
            )
        )

    # Inventory reorder alerts
    low_feed_items = (
        db.query(FeedInventory).filter(FeedInventory.reorder_alert == True).all()
    )
    for item in low_feed_items:
        upd_utc = to_utc(item.updated_at) or now
        alerts.append(
            AlertItem(
                id=f"feed-{item.id}",
                type="inventory_reorder",
                severity="warning",
                title=f"Feed Stock Low: {item.feed_name}",
                message=f"Current stock ({item.current_stock_kg} kg) is below the 5-day consumption threshold ({item.reorder_threshold_kg} kg). Reorder needed.",
                created_at=upd_utc.isoformat(),
            )
        )

    # Data incomplete alert
    if data_incomplete:
        alerts.append(
            AlertItem(
                id=f"incomplete-{effective_date.isoformat()}",
                type="incomplete_data",
                severity="info",
                title="Milking Log Incomplete",
                message=f"More than 10% of the active lactating herd has no logged milking session for {effective_date.isoformat()}.",
                created_at=now.isoformat(),
            )
        )

    return DashboardAnalyticsOut(
        total_cows=total_cows,
        active_cows_count=active_cows_count,
        active_lactating_count=active_lactating_count,
        dry_count=dry_count,
        pregnant_count=pregnant_count,
        culled_count=culled_count,
        total_daily_yield=round(total_daily_yield, 2),
        rolling_7d_yield=round(rolling_7d_daily_avg, 2),
        average_yield_per_cow=round(avg_yield_per_cow, 2),
        fertility_rate=round(fertility_rate, 1),
        feed_conversion_efficiency=round(fce, 2),
        active_withholding_count=active_withholding_count,
        culling_rate=round(culling_rate, 1),
        data_incomplete_warning=data_incomplete,
        lactation_curve=lactation_curve,
        alerts=alerts,
    )
