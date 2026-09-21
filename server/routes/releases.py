import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from server.database import get_db
from server.models.release import Release, ReleaseHold
from server.models.inmate import Inmate, PropertyItem
from server.models.housing import CellAssignment, HousingUnit
from server.models.audit import User
from server.schemas.release import (
    ReleaseEligibilityResponse,
    ReleaseAuthorizeRequest,
    ReleaseResponse,
    ReleaseHoldCreate,
    ReleaseHoldResponse,
)
from server.middleware.auth import get_current_user
from server.middleware.audit import log_audit_event

router = APIRouter(prefix="/releases", tags=["Releases"])


@router.post(
    "/check-eligibility/{inmate_id}", response_model=ReleaseEligibilityResponse
)
def check_release_eligibility(
    inmate_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    inmate = db.query(Inmate).filter(Inmate.id == inmate_id).first()
    if not inmate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Inmate with ID '{inmate_id}' not found.",
        )

    active_holds = (
        db.query(ReleaseHold)
        .filter(ReleaseHold.inmate_id == inmate.id, ReleaseHold.is_active == True)
        .all()
    )

    has_warrants = any(h.hold_type.lower() == "warrant" for h in active_holds)
    has_detainers = any(h.hold_type.lower() == "detainer" for h in active_holds)

    unreturned_items = (
        db.query(PropertyItem)
        .filter(PropertyItem.inmate_id == inmate.id, PropertyItem.status == "STORED")
        .count()
    )
    property_cleared = unreturned_items == 0

    discharge_order_verified = True

    is_eligible = (
        len(active_holds) == 0 and property_cleared and discharge_order_verified
    )

    summary = (
        "Inmate is clear and eligible for release."
        if is_eligible
        else f"Release blocked: {len(active_holds)} active hold(s)/detainer(s), property cleared: {property_cleared}."
    )

    hold_responses = [ReleaseHoldResponse.from_orm(h) for h in active_holds]

    return ReleaseEligibilityResponse(
        inmate_id=inmate.id,
        inmate_name=f"{inmate.first_name} {inmate.last_name}",
        is_eligible_for_release=is_eligible,
        blocking_holds=hold_responses,
        has_active_warrants=has_warrants,
        has_active_detainers=has_detainers,
        property_cleared=property_cleared,
        discharge_order_verified=discharge_order_verified,
        summary=summary,
    )


@router.post("/authorize", response_model=ReleaseResponse)
def authorize_inmate_release(
    request: ReleaseAuthorizeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    inmate = db.query(Inmate).filter(Inmate.id == request.inmate_id).first()
    if not inmate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Inmate with ID '{request.inmate_id}' not found.",
        )

    active_holds = (
        db.query(ReleaseHold)
        .filter(ReleaseHold.inmate_id == inmate.id, ReleaseHold.is_active == True)
        .all()
    )

    if active_holds and not request.force_override:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot authorize release: {len(active_holds)} active hold(s)/detainer(s) exist. Clear holds or supply force_override.",
        )

    now = datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None)

    active_assignment = (
        db.query(CellAssignment)
        .filter(CellAssignment.inmate_id == inmate.id, CellAssignment.is_active == True)
        .first()
    )
    if active_assignment:
        active_assignment.is_active = False
        active_assignment.unassigned_at = now
        unit = (
            db.query(HousingUnit)
            .filter(HousingUnit.id == active_assignment.unit_id)
            .first()
        )
        if unit and unit.current_occupancy > 0:
            unit.current_occupancy -= 1

    db.query(PropertyItem).filter(
        PropertyItem.inmate_id == inmate.id, PropertyItem.status == "STORED"
    ).update({"status": "RETURNED"})

    inmate.status = "DISCHARGED"

    auth_by = request.authorized_by if request.authorized_by else "System Admin"

    release_record = Release(
        inmate_id=inmate.id,
        discharge_order_verified=request.discharge_order_verified,
        property_returned=request.property_returned,
        victim_notified=request.victim_notified,
        authorized_by=auth_by,
        release_time=now,
        status="DISCHARGED",
    )
    db.add(release_record)

    db.commit()
    db.refresh(release_record)

    log_audit_event(
        db=db,
        action="INMATE_RELEASE_AUTHORIZED",
        resource="/api/v1/releases/authorize",
        user_id=current_user.id,
        user_role=current_user.role,
        details=f"Inmate {inmate.id} release authorized by {auth_by}.",
    )

    return release_record


@router.post(
    "/holds", response_model=ReleaseHoldResponse, status_code=status.HTTP_201_CREATED
)
def create_release_hold(
    hold_in: ReleaseHoldCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    inmate = db.query(Inmate).filter(Inmate.id == hold_in.inmate_id).first()
    if not inmate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Inmate with ID '{hold_in.inmate_id}' not found.",
        )

    hold = ReleaseHold(
        inmate_id=hold_in.inmate_id,
        hold_type=hold_in.hold_type,
        issuing_agency=hold_in.issuing_agency or "Law Enforcement Agency",
        description=hold_in.description or "Active hold/detainer",
        is_active=True,
    )
    db.add(hold)
    db.commit()
    db.refresh(hold)

    log_audit_event(
        db=db,
        action="RELEASE_HOLD_ADDED",
        resource="/api/v1/releases/holds",
        user_id=current_user.id,
        user_role=current_user.role,
        details=f"Added {hold_in.hold_type} hold on inmate {inmate.id} from {hold.issuing_agency}",
    )

    return hold
