import uuid
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from server.database import get_db
from server import models, schemas
from server.services.auth_service import get_current_user

router = APIRouter(prefix="/api/v1/finance", tags=["Finance & Cashier Audit"])


@router.post(
    "/shifts/open",
    response_model=schemas.ShiftResponse,
    status_code=status.HTTP_201_CREATED,
)
def open_shift(
    shift_in: schemas.ShiftOpenRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    existing = (
        db.query(models.CashierShift)
        .filter(
            models.CashierShift.cashier_id == current_user.id,
            models.CashierShift.status == "open",
        )
        .first()
    )
    if existing:
        return existing

    shift = models.CashierShift(
        id=str(uuid.uuid4()),
        cashier_id=current_user.id,
        counter_number=shift_in.counter_number,
        opening_cash=shift_in.opening_cash,
        status="open",
    )
    db.add(shift)
    db.commit()
    db.refresh(shift)
    return shift


@router.get("/shifts", response_model=List[schemas.ShiftResponse])
def list_shifts(db: Session = Depends(get_db)):
    return (
        db.query(models.CashierShift)
        .order_by(models.CashierShift.opened_at.desc())
        .all()
    )


@router.post("/shifts/{shift_id}/close", response_model=schemas.ShiftResponse)
def close_shift(
    shift_id: str, close_in: schemas.ShiftCloseRequest, db: Session = Depends(get_db)
):
    shift = (
        db.query(models.CashierShift).filter(models.CashierShift.id == shift_id).first()
    )
    if not shift:
        raise HTTPException(status_code=404, detail="Cashier shift not found")

    if shift.status == "closed":
        return shift

    # Calculate total donations & bookings cash collections
    donations_sum = (
        db.query(func.sum(models.Donation.amount))
        .filter(
            models.Donation.payment_method == "cash",
            models.Donation.created_at >= shift.opened_at,
        )
        .scalar()
        or 0.0
    )

    bookings_sum = (
        db.query(func.sum(models.PoojaBooking.amount_paid))
        .filter(models.PoojaBooking.created_at >= shift.opened_at)
        .scalar()
        or 0.0
    )

    system_calculated = shift.opening_cash + donations_sum + bookings_sum
    actual = close_in.closing_cash_actual
    variance = actual - system_calculated

    shift.closed_at = datetime.now(timezone.utc)
    shift.closing_cash_actual = actual
    shift.system_calculated = system_calculated
    shift.variance = variance
    shift.status = "closed"

    db.commit()
    db.refresh(shift)
    return shift


@router.get("/reports/daily", response_model=schemas.DailyReportResponse)
def get_daily_report(date: Optional[str] = Query(None), db: Session = Depends(get_db)):
    today_str = date or datetime.now(timezone.utc).strftime("%Y-%m-%d")

    total_donations = db.query(func.sum(models.Donation.amount)).scalar() or 0.0
    total_bookings = db.query(func.sum(models.PoojaBooking.amount_paid)).scalar() or 0.0
    total_revenue = total_donations + total_bookings

    fund_breakdown = {
        "annadanam": db.query(func.sum(models.Donation.amount))
        .filter(models.Donation.fund_type == "annadanam")
        .scalar()
        or 0.0,
        "corpus": db.query(func.sum(models.Donation.amount))
        .filter(models.Donation.fund_type == "corpus")
        .scalar()
        or 0.0,
        "general_hundi": db.query(func.sum(models.Donation.amount))
        .filter(models.Donation.fund_type == "general_hundi")
        .scalar()
        or 0.0,
    }

    payment_method_breakdown = {
        "upi": db.query(func.sum(models.Donation.amount))
        .filter(models.Donation.payment_method == "upi")
        .scalar()
        or 0.0,
        "cash": db.query(func.sum(models.Donation.amount))
        .filter(models.Donation.payment_method == "cash")
        .scalar()
        or 0.0,
        "card": db.query(func.sum(models.Donation.amount))
        .filter(models.Donation.payment_method == "card")
        .scalar()
        or 0.0,
    }

    return {
        "date": today_str,
        "total_donations": total_donations,
        "total_pooja_bookings": total_bookings,
        "total_revenue": total_revenue,
        "fund_breakdown": fund_breakdown,
        "payment_method_breakdown": payment_method_breakdown,
    }


@router.get("/audit-logs", response_model=List[schemas.AuditLogResponse])
def get_audit_logs(db: Session = Depends(get_db)):
    return (
        db.query(models.AuditLog)
        .order_by(models.AuditLog.created_at.desc())
        .limit(100)
        .all()
    )
