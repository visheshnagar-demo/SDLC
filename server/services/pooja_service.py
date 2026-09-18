import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from server.database import get_db
from server import models, schemas

router = APIRouter(prefix="/api/v1", tags=["Pooja & Bookings"])


@router.get("/poojas", response_model=List[schemas.PoojaCatalogResponse])
def list_poojas(db: Session = Depends(get_db)):
    return (
        db.query(models.PoojaCatalog)
        .filter(models.PoojaCatalog.is_active == True)
        .all()
    )


@router.post(
    "/poojas",
    response_model=schemas.PoojaCatalogResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_pooja(pooja_in: schemas.PoojaCatalogCreate, db: Session = Depends(get_db)):
    existing = (
        db.query(models.PoojaCatalog)
        .filter(models.PoojaCatalog.code == pooja_in.code)
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="Pooja code already exists")

    pooja = models.PoojaCatalog(
        id=str(uuid.uuid4()),
        code=pooja_in.code,
        name=pooja_in.name,
        description=pooja_in.description,
        default_price=pooja_in.default_price,
        duration_minutes=pooja_in.duration_minutes,
        max_capacity=pooja_in.max_capacity,
        is_active=True,
    )
    db.add(pooja)
    db.commit()
    db.refresh(pooja)
    return pooja


@router.get("/poojas/{pooja_id}/slots", response_model=List[schemas.PoojaSlotResponse])
def list_pooja_slots(
    pooja_id: str, slot_date: Optional[str] = Query(None), db: Session = Depends(get_db)
):
    query = db.query(models.PoojaSlot).filter(models.PoojaSlot.pooja_id == pooja_id)
    if slot_date:
        query = query.filter(models.PoojaSlot.slot_date == slot_date)
    return query.all()


@router.post(
    "/poojas/{pooja_id}/slots",
    response_model=schemas.PoojaSlotResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_pooja_slot(
    pooja_id: str, slot_in: schemas.PoojaSlotBase, db: Session = Depends(get_db)
):
    pooja = (
        db.query(models.PoojaCatalog).filter(models.PoojaCatalog.id == pooja_id).first()
    )
    if not pooja:
        raise HTTPException(status_code=404, detail="Pooja catalog item not found")

    slot = models.PoojaSlot(
        id=str(uuid.uuid4()),
        pooja_id=pooja_id,
        slot_date=slot_in.slot_date,
        start_time=slot_in.start_time,
        end_time=slot_in.end_time,
        capacity=slot_in.capacity or pooja.max_capacity,
        booked_count=0,
        status="open",
    )
    db.add(slot)
    db.commit()
    db.refresh(slot)
    return slot


@router.post(
    "/bookings",
    response_model=schemas.PoojaBookingResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_booking(
    booking_in: schemas.PoojaBookingCreate, db: Session = Depends(get_db)
):
    # Atomic slot reservation with row-level lock (with_for_update)
    slot_query = db.query(models.PoojaSlot).filter(
        models.PoojaSlot.id == booking_in.slot_id
    )
    # Check if database supports with_for_update or SQLite fallback
    try:
        slot = slot_query.with_for_update().first()
    except Exception:
        slot = slot_query.first()

    if not slot:
        raise HTTPException(status_code=404, detail="Pooja slot not found")

    if slot.booked_count >= slot.capacity:
        raise HTTPException(status_code=409, detail="Pooja slot is fully booked")

    slot.booked_count += 1
    if slot.booked_count >= slot.capacity:
        slot.status = "full"

    booking_count = db.query(models.PoojaBooking).count()
    booking_number = f"BOOK-2026-{(booking_count + 1):05d}"
    qr_token = f"QR-PASS-{uuid.uuid4().hex[:12].upper()}"

    booking = models.PoojaBooking(
        id=str(uuid.uuid4()),
        slot_id=slot.id,
        devotee_id=booking_in.devotee_id,
        booking_number=booking_number,
        sankalp_name=booking_in.sankalp_name,
        sankalp_gotra=booking_in.sankalp_gotra,
        amount_paid=booking_in.amount_paid,
        payment_status="completed",
        qr_code_token=qr_token,
        booking_status="confirmed",
    )

    db.add(booking)
    db.commit()
    db.refresh(booking)
    return booking


@router.get("/bookings", response_model=List[schemas.PoojaBookingResponse])
def list_bookings(
    devotee_id: Optional[str] = Query(None), db: Session = Depends(get_db)
):
    query = db.query(models.PoojaBooking)
    if devotee_id:
        query = query.filter(models.PoojaBooking.devotee_id == devotee_id)
    return query.all()


@router.get("/bookings/{booking_id}", response_model=schemas.PoojaBookingResponse)
def get_booking(booking_id: str, db: Session = Depends(get_db)):
    booking = (
        db.query(models.PoojaBooking)
        .filter(models.PoojaBooking.id == booking_id)
        .first()
    )
    if not booking:
        booking = (
            db.query(models.PoojaBooking)
            .filter(models.PoojaBooking.booking_number == booking_id)
            .first()
        )
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    return booking


@router.post(
    "/bookings/{booking_id}/verify-qr", response_model=schemas.PoojaBookingResponse
)
def verify_qr_code(
    booking_id: str,
    verify_in: Optional[schemas.QRVerifyRequest] = None,
    db: Session = Depends(get_db),
):
    booking = (
        db.query(models.PoojaBooking)
        .filter(models.PoojaBooking.id == booking_id)
        .first()
    )
    if not booking:
        booking = (
            db.query(models.PoojaBooking)
            .filter(models.PoojaBooking.booking_number == booking_id)
            .first()
        )
    if not booking and verify_in:
        booking = (
            db.query(models.PoojaBooking)
            .filter(models.PoojaBooking.qr_code_token == verify_in.qr_code_token)
            .first()
        )

    if not booking:
        raise HTTPException(
            status_code=404, detail="Invalid QR pass or booking not found"
        )

    if booking.booking_status == "used":
        raise HTTPException(status_code=400, detail="QR Pass has already been used")

    booking.booking_status = "used"
    db.commit()
    db.refresh(booking)
    return booking
