import uuid
import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

from server.database import get_db
from server.models import Guest, Booking
from server.schemas import (
    GuestCreate,
    GuestUpdate,
    GuestResponse,
)

router = APIRouter()


@router.get("", response_model=List[GuestResponse])
def list_guests(
    search: Optional[str] = Query(
        None, description="Search by name, email, phone, or ID proof number"
    ),
    vip_status: Optional[bool] = Query(None, description="Filter by VIP status"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
):
    query = db.query(Guest)
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            or_(
                Guest.full_name.ilike(search_pattern),
                Guest.email.ilike(search_pattern),
                Guest.phone_number.ilike(search_pattern),
                Guest.id_proof_number.ilike(search_pattern),
            )
        )
    if vip_status is not None:
        query = query.filter(Guest.vip_status == vip_status)

    guests = query.order_by(Guest.full_name.asc()).offset(skip).limit(limit).all()
    return guests


@router.post("", response_model=GuestResponse, status_code=status.HTTP_201_CREATED)
def create_guest(
    payload: GuestCreate,
    db: Session = Depends(get_db),
):
    existing = db.query(Guest).filter(Guest.email == payload.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Guest with email '{payload.email}' already exists",
        )

    guest = Guest(
        id=str(uuid.uuid4()),
        full_name=payload.full_name,
        email=payload.email,
        phone_number=payload.phone_number,
        id_proof_type=payload.id_proof_type,
        id_proof_number=payload.id_proof_number,
        address=payload.address,
        vip_status=payload.vip_status,
    )
    db.add(guest)
    db.commit()
    db.refresh(guest)
    return guest


@router.get("/{guest_id}", response_model=GuestResponse)
def get_guest(
    guest_id: str,
    db: Session = Depends(get_db),
):
    guest = db.query(Guest).filter(Guest.id == guest_id).first()
    if not guest:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Guest with ID '{guest_id}' not found",
        )
    return guest


@router.patch("/{guest_id}", response_model=GuestResponse)
@router.put("/{guest_id}", response_model=GuestResponse)
def update_guest(
    guest_id: str,
    payload: GuestUpdate,
    db: Session = Depends(get_db),
):
    guest = db.query(Guest).filter(Guest.id == guest_id).first()
    if not guest:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Guest with ID '{guest_id}' not found",
        )

    if payload.email is not None and payload.email != guest.email:
        existing = db.query(Guest).filter(Guest.email == payload.email).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Guest with email '{payload.email}' already exists",
            )
        guest.email = payload.email

    if payload.full_name is not None:
        guest.full_name = payload.full_name
    if payload.phone_number is not None:
        guest.phone_number = payload.phone_number
    if payload.id_proof_type is not None:
        guest.id_proof_type = payload.id_proof_type
    if payload.id_proof_number is not None:
        guest.id_proof_number = payload.id_proof_number
    if payload.address is not None:
        guest.address = payload.address
    if payload.vip_status is not None:
        guest.vip_status = payload.vip_status

    guest.updated_at = datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None)
    db.commit()
    db.refresh(guest)
    return guest


@router.delete("/{guest_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_guest(
    guest_id: str,
    db: Session = Depends(get_db),
):
    guest = db.query(Guest).filter(Guest.id == guest_id).first()
    if not guest:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Guest with ID '{guest_id}' not found",
        )

    # Check for active bookings
    active_booking = (
        db.query(Booking)
        .filter(
            Booking.guest_id == guest_id,
            Booking.booking_status.in_(["Reserved", "Confirmed", "CheckedIn"]),
        )
        .first()
    )
    if active_booking:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cannot delete guest with active or upcoming reservations",
        )

    db.delete(guest)
    db.commit()
    return None
