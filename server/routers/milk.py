from datetime import date
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from server.database import get_db
from server.models import Cow, MilkYieldLog, User
from server.schemas import MilkYieldLogCreate, MilkYieldLogResponse
from server.auth import get_current_user

router = APIRouter(prefix="/milk-yields", tags=["Milk Production & Yields"])


@router.get(
    "",
    response_model=List[MilkYieldLogResponse],
    status_code=status.HTTP_200_OK,
    summary="List daily milk production logs",
)
def list_milk_yields(
    cow_id: Optional[str] = Query(None, description="Filter by Cow ID"),
    start_date: Optional[date] = Query(None, description="Start date filter"),
    end_date: Optional[date] = Query(None, description="End date filter"),
    skip: int = Query(0, ge=0),
    limit: int = Query(30, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(MilkYieldLog)
    if cow_id:
        query = query.filter(MilkYieldLog.cow_id == cow_id)
    if start_date:
        query = query.filter(MilkYieldLog.logging_date >= start_date)
    if end_date:
        query = query.filter(MilkYieldLog.logging_date <= end_date)

    logs = (
        query.order_by(MilkYieldLog.logging_date.desc(), MilkYieldLog.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return logs


@router.post(
    "",
    response_model=MilkYieldLogResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Record morning and evening milk yield session",
)
def create_milk_yield(
    log_in: MilkYieldLogCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Verify cow exists
    cow = db.query(Cow).filter(Cow.id == log_in.cow_id).first()
    if not cow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Cow with ID '{log_in.cow_id}' not found",
        )

    if log_in.morning_yield_liters < 0 or log_in.evening_yield_liters < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Milk yields cannot be negative",
        )

    total_yield = round(log_in.morning_yield_liters + log_in.evening_yield_liters, 2)

    # 7-day rolling anomaly detection
    prior_logs = (
        db.query(MilkYieldLog)
        .filter(
            MilkYieldLog.cow_id == log_in.cow_id,
            MilkYieldLog.logging_date <= log_in.logging_date,
        )
        .order_by(MilkYieldLog.logging_date.desc())
        .limit(7)
        .all()
    )

    seven_day_avg = None
    yield_drop_alert = False

    if prior_logs:
        total_prev = sum(l.total_yield_liters for l in prior_logs)
        seven_day_avg = round(total_prev / len(prior_logs), 2)
        # Drop alert triggers if yield is > 30% lower than previous average
        if seven_day_avg > 0 and total_yield < (0.70 * seven_day_avg):
            yield_drop_alert = True
    else:
        seven_day_avg = total_yield

    log = MilkYieldLog(
        cow_id=log_in.cow_id,
        logging_date=log_in.logging_date,
        morning_yield_liters=log_in.morning_yield_liters,
        evening_yield_liters=log_in.evening_yield_liters,
        total_yield_liters=total_yield,
        yield_drop_alert=yield_drop_alert,
        notes=log_in.notes.strip() if log_in.notes else None,
        logged_by=current_user.id,
    )
    db.add(log)
    db.commit()
    db.refresh(log)

    resp = MilkYieldLogResponse.model_validate(log)
    resp.seven_day_average = seven_day_avg
    return resp
