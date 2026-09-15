import csv
import io
from datetime import datetime

from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy import desc
from sqlalchemy.orm import Session

from server.auth import require_roles
from server.database import get_db
from server.models import User, Visit, Visitor
from server.schemas import PaginatedVisitResponse

router = APIRouter(prefix="/api/v1/history", tags=["History & Audit"])


@router.get("", response_model=PaginatedVisitResponse)
def get_visitor_history(
    start_date: datetime | None = Query(
        None, description="Filter visits on/after this datetime"
    ),
    end_date: datetime | None = Query(
        None, description="Filter visits on/before this datetime"
    ),
    status: str | None = Query(None, description="Filter by visit status"),
    host_id: str | None = Query(None, description="Filter by host employee UUID"),
    visitor_name: str | None = Query(None, description="Filter by visitor full name"),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(require_roles(["RECEPTIONIST", "ADMIN", "HOST"])),
    db: Session = Depends(get_db),
):
    """Query visitor history and audit logs with multi-parameter filtering."""
    q = db.query(Visit).join(Visitor, Visit.visitor_id == Visitor.id)

    # Restrict HOST role to their own visits
    if current_user.role == "HOST":
        q = q.filter(Visit.host_id == current_user.id)
    elif host_id:
        q = q.filter(Visit.host_id == host_id)

    if status:
        q = q.filter(Visit.status == status.strip().upper())

    if start_date:
        q = q.filter(Visit.scheduled_start_time >= start_date)

    if end_date:
        q = q.filter(Visit.scheduled_start_time <= end_date)

    if visitor_name:
        q = q.filter(Visitor.full_name.ilike(f"%{visitor_name.strip()}%"))

    total = q.count()
    items = q.order_by(desc(Visit.scheduled_start_time)).offset(skip).limit(limit).all()

    return PaginatedVisitResponse(items=items, total=total, skip=skip, limit=limit)


@router.get("/export")
def export_visitor_history_csv(
    start_date: datetime | None = Query(
        None, description="Filter visits on/after this datetime"
    ),
    end_date: datetime | None = Query(
        None, description="Filter visits on/before this datetime"
    ),
    status: str | None = Query(None, description="Filter by visit status"),
    host_id: str | None = Query(None, description="Filter by host employee UUID"),
    visitor_name: str | None = Query(None, description="Filter by visitor full name"),
    current_user: User = Depends(require_roles(["RECEPTIONIST", "ADMIN", "HOST"])),
    db: Session = Depends(get_db),
):
    """Export filtered visitor history as a downloadable CSV report."""
    q = db.query(Visit).join(Visitor, Visit.visitor_id == Visitor.id)

    if current_user.role == "HOST":
        q = q.filter(Visit.host_id == current_user.id)
    elif host_id:
        q = q.filter(Visit.host_id == host_id)

    if status:
        q = q.filter(Visit.status == status.strip().upper())

    if start_date:
        q = q.filter(Visit.scheduled_start_time >= start_date)

    if end_date:
        q = q.filter(Visit.scheduled_start_time <= end_date)

    if visitor_name:
        q = q.filter(Visitor.full_name.ilike(f"%{visitor_name.strip()}%"))

    visits = q.order_by(desc(Visit.scheduled_start_time)).all()

    output = io.StringIO()
    writer = csv.writer(output)
    # Write CSV header
    writer.writerow(
        [
            "Visit ID",
            "Visitor Name",
            "Visitor Email",
            "Visitor Phone",
            "Company",
            "Host Name",
            "Host Email",
            "Purpose",
            "Status",
            "Pass Code",
            "Badge ID",
            "Scheduled Start",
            "Approved At",
            "Check-In Time",
            "Check-Out Time",
        ]
    )

    for v in visits:
        writer.writerow(
            [
                v.id,
                v.visitor.full_name if v.visitor else "",
                v.visitor.email if v.visitor else "",
                v.visitor.phone if v.visitor else "",
                v.visitor.company or "" if v.visitor else "",
                v.host.full_name if v.host else "",
                v.host.email if v.host else "",
                v.purpose,
                v.status,
                v.pass_code or "",
                v.badge_id or "",
                v.scheduled_start_time.isoformat() if v.scheduled_start_time else "",
                v.approved_at.isoformat() if v.approved_at else "",
                v.check_in_time.isoformat() if v.check_in_time else "",
                v.check_out_time.isoformat() if v.check_out_time else "",
            ]
        )

    content = output.getvalue()
    return Response(
        content=content,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=visitor_history.csv"},
    )
