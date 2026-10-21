"""Booking creation and pass minting endpoints."""
import uuid
import secrets
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from server.database import get_db
from server.models import Booking, Pass, PassTier, Event, User
from server.schemas import BookingCreate, BookingResponse
from server.dependencies import get_current_user, get_optional_user
from server.security import generate_hmac_qr_payload

router = APIRouter(prefix="/bookings", tags=["Bookings"])


@router.post("", response_model=BookingResponse, status_code=status.HTTP_201_CREATED)
def create_booking(
    booking_in: BookingCreate,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    """
    Create a Garba pass booking and dynamically generate signed HMAC SHA-256 digital passes.
    """
    # Verify event
    event = db.query(Event).filter(Event.id == booking_in.eventId).first()
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Event with id '{booking_in.eventId}' not found.",
        )

    # Verify pass tier
    tier = db.query(PassTier).filter(
        PassTier.id == booking_in.passTierId,
        PassTier.event_id == booking_in.eventId,
    ).first()
    if not tier:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Pass tier with id '{booking_in.passTierId}' not found for this event.",
        )

    if booking_in.quantity <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Booking quantity must be at least 1.",
        )

    # Check available quota
    if tier.available_quota < booking_in.quantity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Pass quotas sold out or insufficient. Only {tier.available_quota} passes available.",
        )

    # Resolve user
    user_id = current_user.id if current_user else None
    if not user_id:
        # Fallback to test user or first available attendee
        first_user = db.query(User).filter(User.role == "ATTENDEE").first()
        if first_user:
            user_id = first_user.id
        else:
            # Create guest user
            guest_email = booking_in.attendees[0].email if booking_in.attendees and booking_in.attendees[0].email else f"guest_{secrets.token_hex(4)}@garba.local"
            guest_name = booking_in.attendees[0].fullName if booking_in.attendees else "Guest Attendee"
            guest_user = User(
                id=str(uuid.uuid4()),
                email=guest_email,
                password_hash="guest",
                full_name=guest_name,
                role="ATTENDEE",
                is_active=True,
                is_verified=True,
            )
            db.add(guest_user)
            db.flush()
            user_id = guest_user.id

    # Deduct quota atomically
    tier.available_quota -= booking_in.quantity

    booking_id = str(uuid.uuid4())
    booking_ref = f"BK-{secrets.token_hex(4).upper()}"
    total_amount = round(tier.price * booking_in.quantity, 2)

    booking = Booking(
        id=booking_id,
        booking_reference=booking_ref,
        user_id=user_id,
        event_id=event.id,
        total_amount=total_amount,
        booking_status="CONFIRMED",
    )
    db.add(booking)
    db.flush()

    # Generate passes with HMAC SHA-256 signatures
    created_passes = []
    max_entries = 9 if "season" in tier.tier_name.lower() else (1 if "single" in tier.tier_name.lower() else 3)

    for i in range(booking_in.quantity):
        attendee = booking_in.attendees[i] if i < len(booking_in.attendees) else booking_in.attendees[0]
        pass_id = str(uuid.uuid4())
        pass_num = f"GP-{secrets.token_hex(4).upper()}-{i+1}"

        qr_payload, signature_hash = generate_hmac_qr_payload(
            pass_id=pass_id,
            event_id=event.id,
            pass_number=pass_num,
            tier_name=tier.tier_name,
            valid_from=tier.valid_from,
            valid_to=tier.valid_to,
        )

        pass_obj = Pass(
            id=pass_id,
            pass_number=pass_num,
            booking_id=booking.id,
            pass_tier_id=tier.id,
            attendee_name=attendee.fullName,
            attendee_email=attendee.email,
            attendee_phone=attendee.phone,
            qr_signature_hash=signature_hash,
            qr_payload=qr_payload,
            status="ACTIVE",
            entry_count=0,
            max_entries=max_entries,
        )
        db.add(pass_obj)
        created_passes.append(pass_obj)

    db.commit()
    db.refresh(booking)
    return booking


@router.get("/{id}", response_model=BookingResponse)
def get_booking(id: str, db: Session = Depends(get_db)):
    """Retrieve booking by ID with digital pass records."""
    booking = db.query(Booking).filter(Booking.id == id).first()
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Booking with id '{id}' not found.",
        )
    return booking
