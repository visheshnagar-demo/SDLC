import hashlib
import uuid
import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_

from server.database import get_db
from server.models.inmate import Inmate, Charge, PropertyItem
from server.models.audit import User
from server.schemas.inmate import InmateCreate, InmateResponse
from server.middleware.auth import get_current_user
from server.middleware.audit import log_audit_event

router = APIRouter(prefix="/inmates", tags=["Inmates"])


def generate_ssn_hash(ssn: Optional[str]) -> Optional[str]:
    if not ssn:
        return None
    clean_ssn = ssn.replace("-", "").strip()
    return hashlib.sha256(clean_ssn.encode("utf-8")).hexdigest()


def generate_booking_number() -> str:
    now_str = datetime.datetime.now(datetime.timezone.utc).strftime("%Y%m%d")
    unique_suffix = str(uuid.uuid4().hex[:6]).upper()
    return f"BK-{now_str}-{unique_suffix}"


@router.post("", response_model=InmateResponse, status_code=status.HTTP_201_CREATED)
def create_inmate_intake(
    inmate_in: InmateCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ssn_hash = generate_ssn_hash(inmate_in.ssn)

    if ssn_hash:
        existing_inmate = db.query(Inmate).filter(Inmate.ssn_hash == ssn_hash).first()
        if existing_inmate:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Duplicate inmate record detected with matching SSN/ssn_hash. Existing Booking Number: {existing_inmate.booking_number}",
            )

    booking_number = generate_booking_number()

    inmate = Inmate(
        first_name=inmate_in.first_name,
        last_name=inmate_in.last_name,
        date_of_birth=inmate_in.date_of_birth,
        gender=inmate_in.gender,
        ssn=inmate_in.ssn,
        ssn_hash=ssn_hash,
        booking_number=booking_number,
        security_level=inmate_in.security_level or "MEDIUM",
        gang_affiliation=inmate_in.gang_affiliation,
        medical_alerts=inmate_in.medical_alerts,
        mugshot_url=inmate_in.mugshot_url,
        fingerprint_hash=inmate_in.fingerprint_hash,
        status="BOOKED",
    )
    db.add(inmate)
    db.flush()

    if inmate_in.charges:
        for ch in inmate_in.charges:
            charge = Charge(
                inmate_id=inmate.id,
                charge_code=ch.charge_code,
                description=ch.description,
                severity=ch.severity or "FELONY",
            )
            db.add(charge)

    if inmate_in.property_items:
        for pr in inmate_in.property_items:
            item_name = pr.item_name or pr.item_description or "Property Item"
            loc = pr.location or pr.storage_bin or "Property Locker A"
            prop = PropertyItem(
                inmate_id=inmate.id,
                item_name=item_name,
                quantity=pr.quantity,
                condition=pr.condition or "Good",
                location=loc,
            )
            db.add(prop)

    db.commit()

    full_inmate = (
        db.query(Inmate)
        .options(joinedload(Inmate.charges), joinedload(Inmate.property_items))
        .filter(Inmate.id == inmate.id)
        .first()
    )

    log_audit_event(
        db=db,
        action="INMATE_INTAKE_CREATED",
        resource=f"/api/v1/inmates/{inmate.id}",
        user_id=current_user.id,
        user_role=current_user.role,
        details=f"Inmate {inmate.first_name} {inmate.last_name} booked. Booking #: {booking_number}",
    )

    return full_inmate


@router.get("", response_model=List[InmateResponse])
def list_inmates(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    security_level: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Inmate).options(
        joinedload(Inmate.charges), joinedload(Inmate.property_items)
    )

    if search:
        pattern = f"%{search}%"
        query = query.filter(
            or_(
                Inmate.first_name.ilike(pattern),
                Inmate.last_name.ilike(pattern),
                Inmate.booking_number.ilike(pattern),
            )
        )

    if status_filter:
        query = query.filter(Inmate.status.ilike(status_filter))

    if security_level:
        query = query.filter(Inmate.security_level.ilike(security_level))

    inmates = query.offset(skip).limit(limit).all()
    return inmates


@router.get("/{inmate_id}", response_model=InmateResponse)
def get_inmate_profile(
    inmate_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    inmate = (
        db.query(Inmate)
        .options(joinedload(Inmate.charges), joinedload(Inmate.property_items))
        .filter(Inmate.id == inmate_id)
        .first()
    )
    if not inmate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Inmate with ID '{inmate_id}' not found.",
        )
    return inmate
