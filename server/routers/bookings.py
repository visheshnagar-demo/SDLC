import uuid
import json
import datetime
import random
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from server.database import get_db
from server.models import Booking, Room, Guest, Invoice, InvoiceItem
from server.schemas import (
    BookingCreate,
    BookingUpdate,
    BookingResponse,
    RoomResponse,
    GuestResponse,
)

router = APIRouter()


def _format_room_response(room: Optional[Room]) -> Optional[RoomResponse]:
    if not room:
        return None
    amenities = []
    if room.amenities:
        try:
            amenities = json.loads(room.amenities)
        except Exception:
            amenities = [a.strip() for a in room.amenities.split(",") if a.strip()]
    return RoomResponse(
        id=room.id,
        room_number=room.room_number,
        room_category=room.room_category,
        base_rate_per_night=room.base_rate_per_night,
        status=room.status,
        floor_number=room.floor_number,
        max_occupancy=room.max_occupancy,
        amenities=amenities,
        created_at=room.created_at,
        updated_at=room.updated_at,
    )


def _format_guest_response(guest: Optional[Guest]) -> Optional[GuestResponse]:
    if not guest:
        return None
    return GuestResponse(
        id=guest.id,
        full_name=guest.full_name,
        email=guest.email,
        phone_number=guest.phone_number,
        id_proof_type=guest.id_proof_type,
        id_proof_number=guest.id_proof_number,
        address=guest.address,
        vip_status=guest.vip_status,
        created_at=guest.created_at,
        updated_at=guest.updated_at,
    )


def _format_booking_response(booking: Booking) -> BookingResponse:
    return BookingResponse(
        id=booking.id,
        booking_reference=booking.booking_reference,
        room_id=booking.room_id,
        guest_id=booking.guest_id,
        check_in_date=booking.check_in_date,
        check_out_date=booking.check_out_date,
        total_nights=booking.total_nights,
        total_amount=booking.total_amount,
        booking_status=booking.booking_status,
        actual_check_in=booking.actual_check_in,
        actual_check_out=booking.actual_check_out,
        special_requests=booking.special_requests,
        created_at=booking.created_at,
        updated_at=booking.updated_at,
        room=_format_room_response(booking.room),
        guest=_format_guest_response(booking.guest),
    )


def _generate_booking_reference() -> str:
    year = datetime.date.today().year
    rand_num = random.randint(10000, 99999)
    return f"BK-{year}-{rand_num}"


def _generate_invoice_number() -> str:
    year = datetime.date.today().year
    rand_num = random.randint(10000, 99999)
    return f"INV-{year}-{rand_num}"


@router.get("", response_model=List[BookingResponse])
def list_bookings(
    guest_id: Optional[str] = Query(None, description="Filter by guest ID"),
    room_id: Optional[str] = Query(None, description="Filter by room ID"),
    status: Optional[str] = Query(
        None,
        description="Filter by booking status (Reserved, Confirmed, CheckedIn, CheckedOut, Cancelled)",
    ),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
):
    query = db.query(Booking)
    if guest_id:
        query = query.filter(Booking.guest_id == guest_id)
    if room_id:
        query = query.filter(Booking.room_id == room_id)
    if status:
        query = query.filter(func.lower(Booking.booking_status) == status.lower())

    bookings = query.order_by(Booking.created_at.desc()).offset(skip).limit(limit).all()
    return [_format_booking_response(b) for b in bookings]


@router.post("", response_model=BookingResponse, status_code=status.HTTP_201_CREATED)
def create_booking(
    payload: BookingCreate,
    db: Session = Depends(get_db),
):
    # Validate Guest
    guest = db.query(Guest).filter(Guest.id == payload.guest_id).first()
    if not guest:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Guest with ID '{payload.guest_id}' not found",
        )

    # Validate Room
    room = db.query(Room).filter(Room.id == payload.room_id).first()
    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Room with ID '{payload.room_id}' not found",
        )

    if room.status == "Under Maintenance":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Room {room.room_number} is currently under maintenance",
        )

    # Validate Dates
    try:
        check_in_d = datetime.datetime.strptime(
            payload.check_in_date, "%Y-%m-%d"
        ).date()
        check_out_d = datetime.datetime.strptime(
            payload.check_out_date, "%Y-%m-%d"
        ).date()
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid date format. Dates must be YYYY-MM-DD",
        )

    if check_out_d <= check_in_d:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Check-out date must be strictly after check-in date",
        )

    total_nights = (check_out_d - check_in_d).days
    if total_nights < 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Total nights must be at least 1",
        )

    # Concurrency / Double-booking prevention
    overlapping = (
        db.query(Booking)
        .filter(
            Booking.room_id == payload.room_id,
            Booking.booking_status.in_(["Reserved", "Confirmed", "CheckedIn"]),
            Booking.check_in_date < payload.check_out_date,
            Booking.check_out_date > payload.check_in_date,
        )
        .first()
    )

    if overlapping:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Room {room.room_number} is unavailable for the selected dates (overlap with booking {overlapping.booking_reference})",
        )

    total_amount = round(room.base_rate_per_night * total_nights, 2)
    booking_ref = _generate_booking_reference()

    # Create Booking
    booking = Booking(
        id=str(uuid.uuid4()),
        booking_reference=booking_ref,
        room_id=payload.room_id,
        guest_id=payload.guest_id,
        check_in_date=payload.check_in_date,
        check_out_date=payload.check_out_date,
        total_nights=total_nights,
        total_amount=total_amount,
        booking_status="Reserved",
        special_requests=payload.special_requests,
    )
    db.add(booking)
    db.flush()

    # Automatically create initial Invoice for this booking
    tax_rate = 0.10  # 10% tax
    tax_amount = round(total_amount * tax_rate, 2)
    total_payable = round(total_amount + tax_amount, 2)

    invoice = Invoice(
        id=str(uuid.uuid4()),
        invoice_number=_generate_invoice_number(),
        booking_id=booking.id,
        guest_id=payload.guest_id,
        room_charges=total_amount,
        service_charges=0.0,
        tax_amount=tax_amount,
        total_payable=total_payable,
        payment_status="Pending",
    )
    db.add(invoice)
    db.flush()

    invoice_item = InvoiceItem(
        id=str(uuid.uuid4()),
        invoice_id=invoice.id,
        description=f"Room {room.room_number} ({room.room_category}) - {total_nights} Nights @ ${room.base_rate_per_night:.2f}/night",
        item_type="RoomFee",
        unit_price=room.base_rate_per_night,
        quantity=total_nights,
        total_price=total_amount,
    )
    db.add(invoice_item)

    db.commit()
    db.refresh(booking)
    return _format_booking_response(booking)


@router.get("/{booking_id}", response_model=BookingResponse)
def get_booking(
    booking_id: str,
    db: Session = Depends(get_db),
):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Booking with ID '{booking_id}' not found",
        )
    return _format_booking_response(booking)


@router.post("/{booking_id}/check-in", response_model=BookingResponse)
def check_in_booking(
    booking_id: str,
    db: Session = Depends(get_db),
):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Booking with ID '{booking_id}' not found",
        )

    if booking.booking_status == "CheckedIn":
        return _format_booking_response(booking)

    if booking.booking_status in ["CheckedOut", "Cancelled"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot check in booking with status '{booking.booking_status}'",
        )

    booking.booking_status = "CheckedIn"
    booking.actual_check_in = datetime.datetime.now(datetime.timezone.utc).replace(
        tzinfo=None
    )
    booking.updated_at = datetime.datetime.now(datetime.timezone.utc).replace(
        tzinfo=None
    )

    # Update Room status to Occupied
    if booking.room:
        booking.room.status = "Occupied"
        booking.room.updated_at = datetime.datetime.now(datetime.timezone.utc).replace(
            tzinfo=None
        )

    db.commit()
    db.refresh(booking)
    return _format_booking_response(booking)


@router.post("/{booking_id}/check-out", response_model=BookingResponse)
def check_out_booking(
    booking_id: str,
    db: Session = Depends(get_db),
):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Booking with ID '{booking_id}' not found",
        )

    if booking.booking_status == "CheckedOut":
        return _format_booking_response(booking)

    if booking.booking_status == "Cancelled":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot check out a cancelled booking",
        )

    booking.booking_status = "CheckedOut"
    booking.actual_check_out = datetime.datetime.now(datetime.timezone.utc).replace(
        tzinfo=None
    )
    booking.updated_at = datetime.datetime.now(datetime.timezone.utc).replace(
        tzinfo=None
    )

    # Update Room status to Available
    if booking.room:
        booking.room.status = "Available"
        booking.room.updated_at = datetime.datetime.now(datetime.timezone.utc).replace(
            tzinfo=None
        )

    db.commit()
    db.refresh(booking)
    return _format_booking_response(booking)


@router.post("/{booking_id}/cancel", response_model=BookingResponse)
@router.patch("/{booking_id}/cancel", response_model=BookingResponse)
def cancel_booking(
    booking_id: str,
    db: Session = Depends(get_db),
):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Booking with ID '{booking_id}' not found",
        )

    if booking.booking_status == "Cancelled":
        return _format_booking_response(booking)

    if booking.booking_status == "CheckedOut":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot cancel an already completed / checked-out booking",
        )

    booking.booking_status = "Cancelled"
    booking.updated_at = datetime.datetime.now(datetime.timezone.utc).replace(
        tzinfo=None
    )

    # If the room was marked occupied by this booking, restore to Available
    if booking.room and booking.room.status == "Occupied":
        # Check if another active booking exists for today
        today_str = datetime.date.today().isoformat()
        other_active = (
            db.query(Booking)
            .filter(
                Booking.room_id == booking.room_id,
                Booking.id != booking.id,
                Booking.booking_status == "CheckedIn",
            )
            .first()
        )
        if not other_active:
            booking.room.status = "Available"
            booking.room.updated_at = datetime.datetime.now(
                datetime.timezone.utc
            ).replace(tzinfo=None)

    db.commit()
    db.refresh(booking)
    return _format_booking_response(booking)


@router.patch("/{booking_id}", response_model=BookingResponse)
@router.put("/{booking_id}", response_model=BookingResponse)
def update_booking(
    booking_id: str,
    payload: BookingUpdate,
    db: Session = Depends(get_db),
):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Booking with ID '{booking_id}' not found",
        )

    if payload.special_requests is not None:
        booking.special_requests = payload.special_requests

    if payload.booking_status is not None:
        valid_statuses = [
            "Reserved",
            "Confirmed",
            "CheckedIn",
            "CheckedOut",
            "Cancelled",
        ]
        if payload.booking_status not in valid_statuses:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid booking status '{payload.booking_status}'. Must be one of {valid_statuses}",
            )
        booking.booking_status = payload.booking_status

    if payload.check_in_date is not None or payload.check_out_date is not None:
        new_checkin = payload.check_in_date or booking.check_in_date
        new_checkout = payload.check_out_date or booking.check_out_date

        try:
            d_in = datetime.datetime.strptime(new_checkin, "%Y-%m-%d").date()
            d_out = datetime.datetime.strptime(new_checkout, "%Y-%m-%d").date()
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid date format. Dates must be YYYY-MM-DD",
            )

        if d_out <= d_in:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Check-out date must be strictly after check-in date",
            )

        # Check overlapping
        overlapping = (
            db.query(Booking)
            .filter(
                Booking.room_id == booking.room_id,
                Booking.id != booking.id,
                Booking.booking_status.in_(["Reserved", "Confirmed", "CheckedIn"]),
                Booking.check_in_date < new_checkout,
                Booking.check_out_date > new_checkin,
            )
            .first()
        )
        if overlapping:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Selected dates overlap with an existing booking",
            )

        booking.check_in_date = new_checkin
        booking.check_out_date = new_checkout
        total_nights = (d_out - d_in).days
        booking.total_nights = total_nights
        if booking.room:
            booking.total_amount = round(
                booking.room.base_rate_per_night * total_nights, 2
            )

    booking.updated_at = datetime.datetime.now(datetime.timezone.utc).replace(
        tzinfo=None
    )
    db.commit()
    db.refresh(booking)
    return _format_booking_response(booking)
