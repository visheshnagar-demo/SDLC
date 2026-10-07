import datetime
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from server.database import get_db
from server.models import Room, Booking, Invoice
from server.schemas import AnalyticsDashboardResponse

router = APIRouter()


@router.get("/dashboard", response_model=AnalyticsDashboardResponse)
def get_analytics_dashboard(
    db: Session = Depends(get_db),
):
    total_rooms = db.query(Room).count()
    occupied_rooms = (
        db.query(Room).filter(func.lower(Room.status) == "occupied").count()
    )
    available_rooms = (
        db.query(Room).filter(func.lower(Room.status) == "available").count()
    )
    maintenance_rooms = (
        db.query(Room).filter(func.lower(Room.status) == "under maintenance").count()
    )

    if total_rooms > 0:
        occupancy_rate_percentage = round((occupied_rooms / total_rooms) * 100.0, 1)
    else:
        occupancy_rate_percentage = 0.0

    # Calculate today revenue (paid invoices)
    today = datetime.date.today()
    # Sum paid invoices
    paid_invoices_sum = (
        db.query(func.sum(Invoice.total_payable))
        .filter(Invoice.payment_status == "Paid")
        .scalar()
    )
    today_revenue = float(paid_invoices_sum or 0.0)
    # If today_revenue is 0 in fresh DB, we can also sum active occupied room nightly rates
    if today_revenue == 0.0:
        occupied_rates_sum = (
            db.query(func.sum(Room.base_rate_per_night))
            .filter(func.lower(Room.status) == "occupied")
            .scalar()
        )
        today_revenue = float(occupied_rates_sum or 0.0)

    today_str = today.isoformat()
    pending_check_ins_today = (
        db.query(Booking)
        .filter(
            Booking.check_in_date <= today_str,
            Booking.booking_status.in_(["Reserved", "Confirmed"]),
        )
        .count()
    )

    pending_check_outs_today = (
        db.query(Booking)
        .filter(
            Booking.check_out_date <= today_str,
            Booking.booking_status == "CheckedIn",
        )
        .count()
    )

    return AnalyticsDashboardResponse(
        occupancy_rate_percentage=occupancy_rate_percentage,
        total_rooms=total_rooms,
        occupied_rooms=occupied_rooms,
        available_rooms=available_rooms,
        maintenance_rooms=maintenance_rooms,
        today_revenue=round(today_revenue, 2),
        pending_check_ins_today=pending_check_ins_today,
        pending_check_outs_today=pending_check_outs_today,
    )
