import uuid
from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from server.core.deps import get_current_user, get_db
from server.models.booking import ClassBooking
from server.models.fitness_class import FitnessClass
from server.models.membership import UserMembership
from server.models.user import User
from server.schemas.booking import BookingCreate, BookingRead

router = APIRouter()


def _format_booking_response(booking: ClassBooking) -> BookingRead:
    fc = booking.fitness_class
    return BookingRead(
        id=booking.id,
        user_id=booking.user_id,
        class_id=booking.class_id,
        status=booking.status,
        booked_at=booking.booked_at,
        class_title=fc.title if fc else None,
        start_time=fc.start_time if fc else None,
        end_time=fc.end_time if fc else None,
        instructor_name=fc.instructor_name if fc else None,
    )


@router.post("", response_model=BookingRead, status_code=status.HTTP_201_CREATED)
def create_booking(
    req: BookingCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # 1. Verify class exists
    fitness_class = (
        db.query(FitnessClass).filter(FitnessClass.id == req.class_id).first()
    )
    if not fitness_class:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Class not found",
        )

    # 2. Verify active membership
    active_membership = (
        db.query(UserMembership)
        .filter(
            UserMembership.user_id == current_user.id,
            UserMembership.status == "ACTIVE",
        )
        .first()
    )
    if not active_membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Active membership required to book classes",
        )

    # 3. Check for existing active booking
    existing_booking = (
        db.query(ClassBooking)
        .filter(
            ClassBooking.user_id == current_user.id,
            ClassBooking.class_id == req.class_id,
            ClassBooking.status == "CONFIRMED",
        )
        .first()
    )
    if existing_booking:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Already booked for this class",
        )

    # 4. Check class capacity & anti-overbooking
    if fitness_class.booked_count >= fitness_class.max_capacity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Class is already full",
        )

    # 5. Atomic increment and booking creation
    fitness_class.booked_count += 1
    db.add(fitness_class)

    new_booking = ClassBooking(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        class_id=fitness_class.id,
        status="CONFIRMED",
        booked_at=datetime.now(timezone.utc),
    )
    db.add(new_booking)
    db.commit()
    db.refresh(new_booking)

    return _format_booking_response(new_booking)


@router.get("/me", response_model=List[BookingRead])
def get_my_bookings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    bookings = (
        db.query(ClassBooking)
        .filter(ClassBooking.user_id == current_user.id)
        .order_by(ClassBooking.booked_at.desc())
        .all()
    )
    return [_format_booking_response(b) for b in bookings]


@router.delete("/{booking_id}")
def cancel_booking(
    booking_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    booking = (
        db.query(ClassBooking)
        .filter(
            ClassBooking.id == booking_id,
            ClassBooking.user_id == current_user.id,
        )
        .first()
    )
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found",
        )

    if booking.status == "CANCELLED":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Booking is already cancelled",
        )

    # Check 2-hour pre-class cancellation policy
    start_time = booking.fitness_class.start_time
    if start_time.tzinfo is None:
        start_time = start_time.replace(tzinfo=timezone.utc)

    now = datetime.now(timezone.utc)
    time_to_class = (start_time - now).total_seconds()
    if time_to_class < 2 * 3600:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cancellation window expired (< 2 hours)",
        )

    # Update booking and release spot
    booking.status = "CANCELLED"
    if booking.fitness_class.booked_count > 0:
        booking.fitness_class.booked_count -= 1
        db.add(booking.fitness_class)

    db.add(booking)
    db.commit()

    return {"detail": "Booking cancelled successfully"}
