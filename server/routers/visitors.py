from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from server.database import get_db
from server.models import User, Visit, VisitAuditLog, Visitor
from server.notifications import notify_host_incoming_request
from server.schemas import HostSummary, VisitDetailResponse, VisitorRegisterRequest

router = APIRouter(prefix="/api/v1/visitors", tags=["Visitors"])


@router.get("/hosts", response_model=list[HostSummary])
def get_available_hosts(db: Session = Depends(get_db)):
    """List available host employees for visitor pre-registration."""
    hosts = db.query(User).filter(User.is_active == True).all()
    return hosts


@router.post(
    "/register", response_model=VisitDetailResponse, status_code=status.HTTP_201_CREATED
)
def register_visitor(payload: VisitorRegisterRequest, db: Session = Depends(get_db)):
    """Pre-register a visitor and create a pending visit request."""
    # 1. Validate host employee exists
    host = (
        db.query(User)
        .filter(User.id == payload.host_id, User.is_active == True)
        .first()
    )
    if not host:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Host employee with ID '{payload.host_id}' not found or inactive",
        )

    # 2. Find or create visitor
    visitor = db.query(Visitor).filter(Visitor.email == payload.email).first()
    if not visitor:
        visitor = Visitor(
            full_name=payload.full_name,
            email=payload.email,
            phone=payload.phone,
            company=payload.company,
        )
        db.add(visitor)
        db.flush()
    else:
        # Update details with latest info
        visitor.full_name = payload.full_name
        visitor.phone = payload.phone
        if payload.company:
            visitor.company = payload.company
        db.flush()

    # 3. Create Visit record
    visit = Visit(
        visitor_id=visitor.id,
        host_id=host.id,
        purpose=payload.purpose,
        scheduled_start_time=payload.scheduled_start_time,
        scheduled_end_time=payload.scheduled_end_time,
        status="PENDING",
    )
    db.add(visit)
    db.flush()

    # 4. Create Audit Log entry
    audit_log = VisitAuditLog(
        visit_id=visit.id,
        actor_id=None,
        actor_role="VISITOR",
        action="REGISTERED",
        details={
            "visitor_email": visitor.email,
            "host_email": host.email,
            "purpose": payload.purpose,
            "scheduled_start_time": payload.scheduled_start_time.isoformat(),
        },
    )
    db.add(audit_log)

    # 5. Trigger host notification
    notify_host_incoming_request(visit, host, visitor)

    db.commit()
    db.refresh(visit)
    return visit
