import json
import uuid
import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from server.database import get_db
from server.models import Inmate, VisitorLog, VisitorBlacklist, AuditLog, User
from server.schemas import (
    VisitorCheckInRequest,
    VisitorCheckOutRequest,
    VisitorLogResponse,
    VisitorBlacklistCreate,
    VisitorBlacklistResponse,
)
from server.routers.auth import get_current_user, RequireRole

router = APIRouter(prefix="/api/v1/visitors", tags=["visitors"])


def log_audit(db: Session, user: Optional[User], action: str, resource_type: str, resource_id: str, before: dict, after: dict):
    user_id = user.id if user else None
    user_role = user.role if user else "SYSTEM"
    log = AuditLog(
        id=str(uuid.uuid4()),
        user_id=user_id,
        user_role=user_role,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        payload_before=json.dumps(before),
        payload_after=json.dumps(after),
        created_at=datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None),
    )
    db.add(log)


@router.post("/check-in", response_model=VisitorLogResponse, status_code=status.HTTP_200_OK)
def check_in_visitor(
    req: VisitorCheckInRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Verify inmate exists
    inmate = db.query(Inmate).filter(Inmate.id == req.inmate_id).first()
    if not inmate:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Inmate record not found.")

    # Screen blacklist
    banned = db.query(VisitorBlacklist).filter(
        VisitorBlacklist.visitor_id_number == req.visitor_id_number
    ).first()

    if banned:
        log_audit(
            db,
            current_user,
            action="VISITOR_CHECK_IN_BLOCKED",
            resource_type="VISITOR",
            resource_id=req.visitor_id_number,
            before={},
            after={"visitor_id_number": req.visitor_id_number, "reason": banned.reason},
        )
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access denied: Visitor ID '{req.visitor_id_number}' is on the banned list. Reason: {banned.reason}",
        )

    now = datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None)
    visitor_log = VisitorLog(
        id=str(uuid.uuid4()),
        visitor_id_number=req.visitor_id_number,
        visitor_name=req.visitor_name,
        inmate_id=req.inmate_id,
        check_in_time=now,
        status="CHECKED_IN",
    )
    db.add(visitor_log)
    db.commit()
    db.refresh(visitor_log)

    log_audit(
        db,
        current_user,
        action="VISITOR_CHECK_IN",
        resource_type="VISITOR",
        resource_id=visitor_log.id,
        before={},
        after={"visitor_name": req.visitor_name, "inmate_id": req.inmate_id},
    )
    db.commit()

    return visitor_log


@router.post("/check-out", response_model=VisitorLogResponse)
def check_out_visitor(
    req: VisitorCheckOutRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    v_log = db.query(VisitorLog).filter(VisitorLog.id == req.visitor_log_id).first()
    if not v_log:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Visitor log entry not found.")

    now = datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None)
    v_log.check_out_time = now
    v_log.status = "COMPLETED"
    db.commit()
    db.refresh(v_log)

    log_audit(
        db,
        current_user,
        action="VISITOR_CHECK_OUT",
        resource_type="VISITOR",
        resource_id=v_log.id,
        before={"status": "CHECKED_IN"},
        after={"status": "COMPLETED", "check_out_time": now.isoformat()},
    )
    db.commit()

    return v_log


@router.get("/logs", response_model=List[VisitorLogResponse])
def list_visitor_logs(
    inmate_id: Optional[str] = None,
    status_filter: Optional[str] = Query(None, alias="status"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(VisitorLog)
    if inmate_id:
        query = query.filter(VisitorLog.inmate_id == inmate_id)
    if status_filter:
        query = query.filter(VisitorLog.status == status_filter.upper())
    return query.order_by(VisitorLog.check_in_time.desc()).all()


@router.post("/blacklist", response_model=VisitorBlacklistResponse, status_code=status.HTTP_201_CREATED)
def add_to_blacklist(
    req: VisitorBlacklistCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    existing = db.query(VisitorBlacklist).filter(
        VisitorBlacklist.visitor_id_number == req.visitor_id_number
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Visitor ID '{req.visitor_id_number}' is already blacklisted.",
        )

    banned = VisitorBlacklist(
        id=str(uuid.uuid4()),
        visitor_id_number=req.visitor_id_number,
        reason=req.reason,
        banned_by=current_user.id,
        banned_at=datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None),
    )
    db.add(banned)
    db.commit()
    db.refresh(banned)

    log_audit(
        db,
        current_user,
        action="ADD_VISITOR_BLACKLIST",
        resource_type="VISITOR_BLACKLIST",
        resource_id=banned.id,
        before={},
        after={"visitor_id_number": req.visitor_id_number, "reason": req.reason},
    )
    db.commit()

    return banned


@router.get("/blacklist", response_model=List[VisitorBlacklistResponse])
def list_blacklist(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return db.query(VisitorBlacklist).all()
