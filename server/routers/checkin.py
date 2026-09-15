from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import desc, or_
from sqlalchemy.orm import Session

from server.auth import require_roles
from server.database import get_db
from server.models import User, Visit, VisitAuditLog, Visitor
from server.schemas import CheckInRequest, VisitDetailResponse

router = APIRouter(prefix="/api/v1/checkin", tags=["Check-In / Check-Out"])


@router.get("/lookup", response_model=list[VisitDetailResponse])
def lookup_visitors(
    query: str | None = Query(
        None, description="Search by pass code, full name, email, or phone"
    ),
    status: str | None = Query(None, description="Filter by visit status"),
    current_user: User = Depends(require_roles(["RECEPTIONIST", "ADMIN", "HOST"])),
    db: Session = Depends(get_db),
):
    """Search visitors for check-in / check-out verification."""
    q = db.query(Visit).join(Visitor, Visit.visitor_id == Visitor.id)

    if query:
        search_term = f"%{query.strip()}%"
        q = q.filter(
            or_(
                Visit.pass_code.ilike(search_term),
                Visitor.full_name.ilike(search_term),
                Visitor.email.ilike(search_term),
                Visitor.phone.ilike(search_term),
                Visitor.company.ilike(search_term),
            )
        )

    if status:
        q = q.filter(Visit.status == status.strip().upper())

    results = q.order_by(desc(Visit.created_at)).limit(50).all()
    return results


@router.post("/{visit_id}/check-in", response_model=VisitDetailResponse)
def check_in_visitor(
    visit_id: str,
    payload: CheckInRequest | None = None,
    current_user: User = Depends(require_roles(["RECEPTIONIST", "ADMIN"])),
    db: Session = Depends(get_db),
):
    """Check in an approved visitor upon arrival at reception."""
    visit = db.query(Visit).filter(Visit.id == visit_id).first()
    if not visit:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Visit with ID '{visit_id}' not found",
        )

    if visit.status == "CHECKED_IN":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Visitor is already checked in",
        )

    if visit.status != "APPROVED":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot check in a visit with status '{visit.status}'. Visit must be in APPROVED status.",
        )

    now_utc = datetime.now(timezone.utc)
    visit.status = "CHECKED_IN"
    visit.check_in_time = now_utc
    if payload and payload.badge_id:
        visit.badge_id = payload.badge_id

    audit_log = VisitAuditLog(
        visit_id=visit.id,
        actor_id=current_user.id,
        actor_role=current_user.role,
        action="CHECKED_IN",
        details={
            "check_in_time": now_utc.isoformat(),
            "badge_id": visit.badge_id,
            "checked_in_by": current_user.email,
        },
    )
    db.add(audit_log)

    db.commit()
    db.refresh(visit)
    return visit


@router.post("/{visit_id}/check-out", response_model=VisitDetailResponse)
def check_out_visitor(
    visit_id: str,
    current_user: User = Depends(require_roles(["RECEPTIONIST", "ADMIN"])),
    db: Session = Depends(get_db),
):
    """Check out a visitor upon departure from the premises."""
    visit = db.query(Visit).filter(Visit.id == visit_id).first()
    if not visit:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Visit with ID '{visit_id}' not found",
        )

    if visit.status == "CHECKED_OUT":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Visitor is already checked out",
        )

    if visit.status != "CHECKED_IN":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot check out a visit with status '{visit.status}'. Visitor must be currently CHECKED_IN.",
        )

    now_utc = datetime.now(timezone.utc)
    visit.status = "CHECKED_OUT"
    visit.check_out_time = now_utc

    audit_log = VisitAuditLog(
        visit_id=visit.id,
        actor_id=current_user.id,
        actor_role=current_user.role,
        action="CHECKED_OUT",
        details={
            "check_out_time": now_utc.isoformat(),
            "checked_out_by": current_user.email,
        },
    )
    db.add(audit_log)

    db.commit()
    db.refresh(visit)
    return visit
