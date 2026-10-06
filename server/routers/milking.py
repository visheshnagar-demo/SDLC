from datetime import date, datetime, timedelta, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from server.database import get_db
from server.models import Cattle, MilkLog, HealthRecord
from server.schemas import MilkLogCreate, MilkLogOut, MilkSummaryOut, MilkDailyTrend

router = APIRouter(prefix="/api/v1/milk-logs", tags=["Milk Production & Logging"])


def to_utc(dt: Optional[datetime]) -> Optional[datetime]:
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


@router.get("", response_model=List[MilkLogOut])
def list_milk_logs(
    cow_id: Optional[str] = Query(None),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    session_filter: Optional[str] = Query(None, alias="session"),
    is_withheld: Optional[bool] = Query(None),
    variance_alert: Optional[bool] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=500),
    db: Session = Depends(get_db),
):
    """Retrieve milking session logs with optional filters."""
    query = db.query(MilkLog)

    if cow_id:
        query = query.filter(MilkLog.cow_id == cow_id)
    if start_date:
        query = query.filter(MilkLog.milking_date >= start_date)
    if end_date:
        query = query.filter(MilkLog.milking_date <= end_date)
    if session_filter:
        query = query.filter(MilkLog.session.ilike(session_filter))
    if is_withheld is not None:
        query = query.filter(MilkLog.is_withheld == is_withheld)
    if variance_alert is not None:
        query = query.filter(MilkLog.variance_alert == variance_alert)

    return (
        query.order_by(MilkLog.milking_date.desc(), MilkLog.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


@router.post("", response_model=MilkLogOut, status_code=status.HTTP_201_CREATED)
def create_milk_log(payload: MilkLogCreate, db: Session = Depends(get_db)):
    """Record a milking session yield with automatic withdrawal enforcement and >30% yield drop mastitis detection."""
    cow = db.query(Cattle).filter(Cattle.id == payload.cow_id).first()
    if not cow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Cattle with ID '{payload.cow_id}' not found",
        )

    now = datetime.now(timezone.utc)
    # Check active withdrawal
    health_recs = (
        db.query(HealthRecord)
        .filter(
            HealthRecord.cow_id == payload.cow_id,
            HealthRecord.milk_withdrawal_end.isnot(None),
        )
        .all()
    )
    is_withheld = any(
        to_utc(hr.milk_withdrawal_end) is not None
        and to_utc(hr.milk_withdrawal_end) > now
        for hr in health_recs
    )

    # Check 7-day rolling yield average for this cow to detect >30% drop (mastitis warning)
    seven_days_ago = payload.milking_date - timedelta(days=7)
    past_logs = (
        db.query(MilkLog)
        .filter(
            MilkLog.cow_id == payload.cow_id,
            MilkLog.milking_date >= seven_days_ago,
            MilkLog.milking_date <= payload.milking_date,
        )
        .all()
    )

    variance_alert = False
    if past_logs:
        # Calculate daily or session average
        total_past_yield = sum(log.yield_liters for log in past_logs)
        avg_past_yield = total_past_yield / len(past_logs)
        # >30% drop from average: current < 0.7 * avg
        if avg_past_yield > 0 and payload.yield_liters < (0.70 * avg_past_yield):
            variance_alert = True

    new_log = MilkLog(
        cow_id=payload.cow_id,
        milking_date=payload.milking_date,
        session=payload.session,
        yield_liters=payload.yield_liters,
        fat_percentage=payload.fat_percentage,
        protein_percentage=payload.protein_percentage,
        somatic_cell_count=payload.somatic_cell_count,
        is_withheld=is_withheld,
        variance_alert=variance_alert,
    )
    db.add(new_log)
    db.commit()
    db.refresh(new_log)
    return new_log


@router.get("/summary", response_model=MilkSummaryOut)
def get_milk_summary(
    target_date: Optional[date] = Query(None),
    db: Session = Depends(get_db),
):
    """Get aggregate milk production KPIs, session totals, and 7-day rolling trends."""
    ref_date = target_date or date.today()
    seven_days_ago = ref_date - timedelta(days=6)

    all_logs = db.query(MilkLog).all()

    total_yield = sum(log.yield_liters for log in all_logs)
    withheld_yield = sum(log.yield_liters for log in all_logs if log.is_withheld)
    variance_count = sum(1 for log in all_logs if log.variance_alert)

    # Session breakdown for ref_date
    date_logs = [log for log in all_logs if log.milking_date == ref_date]
    if not date_logs and all_logs:
        # Fallback to latest date with logs
        latest_date = max(log.milking_date for log in all_logs)
        date_logs = [log for log in all_logs if log.milking_date == latest_date]

    morning_yield = sum(
        log.yield_liters for log in date_logs if log.session.lower() == "morning"
    )
    evening_yield = sum(
        log.yield_liters for log in date_logs if log.session.lower() == "evening"
    )
    afternoon_yield = sum(
        log.yield_liters for log in date_logs if log.session.lower() == "afternoon"
    )

    # Distinct cows in date_logs
    distinct_cows_today = set(log.cow_id for log in date_logs)
    day_total = sum(log.yield_liters for log in date_logs)
    avg_per_cow = (day_total / len(distinct_cows_today)) if distinct_cows_today else 0.0

    # 7-day rolling yield calculation
    rolling_logs = [
        log for log in all_logs if seven_days_ago <= log.milking_date <= ref_date
    ]
    total_7d_yield = sum(log.yield_liters for log in rolling_logs)
    # Average daily yield over 7 days
    rolling_7d_daily_avg = total_7d_yield / 7.0 if rolling_logs else 0.0

    # Build daily trends for last 7 days
    daily_trends: List[MilkDailyTrend] = []
    for d_offset in range(7):
        curr_day = seven_days_ago + timedelta(days=d_offset)
        curr_logs = [log for log in all_logs if log.milking_date == curr_day]
        curr_total = sum(l.yield_liters for l in curr_logs)
        curr_morning = sum(
            l.yield_liters for l in curr_logs if l.session.lower() == "morning"
        )
        curr_evening = sum(
            l.yield_liters for l in curr_logs if l.session.lower() == "evening"
        )
        curr_cows = set(l.cow_id for l in curr_logs)
        curr_avg = (curr_total / len(curr_cows)) if curr_cows else 0.0
        daily_trends.append(
            MilkDailyTrend(
                date=curr_day.isoformat(),
                total_yield=round(curr_total, 2),
                morning_yield=round(curr_morning, 2),
                evening_yield=round(curr_evening, 2),
                avg_yield_per_cow=round(curr_avg, 2),
                session_count=len(curr_logs),
            )
        )

    return MilkSummaryOut(
        total_yield=round(total_yield, 2),
        average_yield_per_cow=round(avg_per_cow, 2),
        morning_yield=round(morning_yield, 2),
        evening_yield=round(evening_yield, 2),
        afternoon_yield=round(afternoon_yield, 2),
        rolling_7d_yield=round(rolling_7d_daily_avg, 2),
        withheld_yield=round(withheld_yield, 2),
        variance_alerts_count=variance_count,
        daily_trends=daily_trends,
    )
