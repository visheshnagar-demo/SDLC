import secrets
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import desc
from sqlalchemy.orm import Session

from server.auth import require_roles
from server.database import get_db
from server.models import User, Visit, VisitAuditLog
from server.notifications import notify_visitor_decision
from server.schemas import (
    ApprovalActionRequest,
    VisitDetailResponse,
)

router = APIRouter(prefix="/api/v1/approvals", tags=["Approvals"])


def generate_unique_pass_code(db: Session) -> str:
    """Generate a unique 8-character uppercase alphanumeric pass code prefixed with VP-"""
    for _ in range(20):
        code = f"VP-{secrets.token_hex(4).upper()}"
        existing = db.query(Visit).filter(Visit.pass_code == code).first()
        if not existing:
            return code
    # Fallback with timestamp
    return f"VP-{int(datetime.now(timezone.utc).timestamp())}"


@router.get("/pending", response_model=list[VisitDetailResponse])
def get_pending_approvals(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    host_id: str | None = Query(None),
    current_user: User = Depends(require_roles(["HOST", "ADMIN", "RECEPTIONIST"])),
    db: Session = Depends(get_db),
):
    """List pending visit requests awaiting host approval."""
    query = db.query(Visit).filter(Visit.status.in_(["PENDING", "PENDING_APPROVAL"]))

    # If user is a HOST (and not ADMIN/RECEPTIONIST), restrict strictly to their own requests
    if current_user.role == "HOST":
        query = query.filter(Visit.host_id == current_user.id)
    elif host_id:
        query = query.filter(Visit.host_id == host_id)

    items = query.order_by(desc(Visit.created_at)).offset(skip).limit(limit).all()
    return items


@router.post("/{visit_id}/action", response_model=VisitDetailResponse)
def handle_approval_action(
    visit_id: str,
    payload: ApprovalActionRequest,
    current_user: User = Depends(require_roles(["HOST", "ADMIN"])),
    db: Session = Depends(get_db),
):
    """Approve or reject a pending visit request."""
    visit = db.query(Visit).filter(Visit.id == visit_id).first()
    if not visit:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Visit request with ID '{visit_id}' not found",
        )

    # RBAC check: Host can only act on their own visits, Admin can act on any
    if current_user.role == "HOST" and visit.host_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: You can only approve or reject visits where you are designated as the host",
        )

    # Validate status
    if visit.status not in ("PENDING", "PENDING_APPROVAL"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot perform approval action on a visit with status '{visit.status}'",
        )

    action_normalized = payload.action.strip().upper()
    now_utc = datetime.now(timezone.utc)

    if action_normalized in ("APPROVE", "APPROVED"):
        pass_code = generate_unique_pass_code(db)
        visit.status = "APPROVED"
        visit.pass_code = pass_code
        visit.approved_at = now_utc
        visit.approval_notes = payload.approval_notes

        audit_log = VisitAuditLog(
            visit_id=visit.id,
            actor_id=current_user.id,
            actor_role=current_user.role,
            action="APPROVED",
            details={
                "pass_code": pass_code,
                "approval_notes": payload.approval_notes,
                "approved_by": current_user.email,
            },
        )
        db.add(audit_log)

        # Notify visitor of approval with pass code
        notify_visitor_decision(
            visit=visit,
            visitor=visit.visitor,
            host=visit.host,
            action="APPROVE",
            pass_code=pass_code,
            notes=payload.approval_notes,
        )

    elif action_normalized in ("REJECT", "REJECTED"):
        visit.status = "REJECTED"
        visit.approval_notes = payload.approval_notes

        audit_log = VisitAuditLog(
            visit_id=visit.id,
            actor_id=current_user.id,
            actor_role=current_user.role,
            action="REJECTED",
            details={
                "rejection_notes": payload.approval_notes,
                "rejected_by": current_user.email,
            },
        )
        db.add(audit_log)

        # Notify visitor of rejection
        notify_visitor_decision(
            visit=visit,
            visitor=visit.visitor,
            host=visit.host,
            action="REJECT",
            notes=payload.approval_notes,
        )

    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid action '{payload.action}'. Expected 'APPROVE' or 'REJECT'",
        )

    db.commit()
    db.refresh(visit)
    return visit
