import json
import uuid
import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from server.database import get_db
from server.models import Room, Booking
from server.schemas import (
    RoomCreate,
    RoomUpdate,
    RoomStatusUpdate,
    RoomResponse,
)

router = APIRouter()


def _format_room_response(room: Room) -> RoomResponse:
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


@router.get("", response_model=List[RoomResponse])
def list_rooms(
    category: Optional[str] = Query(
        None, description="Filter by category (Standard, Deluxe, Suite)"
    ),
    status: Optional[str] = Query(
        None,
        description="Filter by status (Available, Occupied, Under Maintenance, Reserved)",
    ),
    floor: Optional[int] = Query(None, description="Filter by floor number"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
):
    query = db.query(Room)
    if category:
        query = query.filter(func.lower(Room.room_category) == category.lower())
    if status:
        query = query.filter(func.lower(Room.status) == status.lower())
    if floor is not None:
        query = query.filter(Room.floor_number == floor)

    rooms = query.order_by(Room.room_number.asc()).offset(skip).limit(limit).all()
    return [_format_room_response(r) for r in rooms]


@router.post("", response_model=RoomResponse, status_code=status.HTTP_201_CREATED)
def create_room(
    payload: RoomCreate,
    db: Session = Depends(get_db),
):
    existing = db.query(Room).filter(Room.room_number == payload.room_number).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Room with number '{payload.room_number}' already exists",
        )

    valid_categories = ["Standard", "Deluxe", "Suite"]
    # Normalize category capitalization if matched case-insensitively
    cat_match = next(
        (c for c in valid_categories if c.lower() == payload.room_category.lower()),
        payload.room_category,
    )

    room = Room(
        id=str(uuid.uuid4()),
        room_number=payload.room_number,
        room_category=cat_match,
        base_rate_per_night=payload.base_rate_per_night,
        status="Available",
        floor_number=payload.floor_number,
        max_occupancy=payload.max_occupancy,
        amenities=json.dumps(payload.amenities),
    )
    db.add(room)
    db.commit()
    db.refresh(room)
    return _format_room_response(room)


@router.get("/{room_id}", response_model=RoomResponse)
def get_room(
    room_id: str,
    db: Session = Depends(get_db),
):
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Room with ID '{room_id}' not found",
        )
    return _format_room_response(room)


@router.patch("/{room_id}/status", response_model=RoomResponse)
def update_room_status(
    room_id: str,
    payload: RoomStatusUpdate,
    db: Session = Depends(get_db),
):
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Room with ID '{room_id}' not found",
        )

    valid_statuses = ["Available", "Occupied", "Under Maintenance", "Reserved"]
    normalized_status = next(
        (s for s in valid_statuses if s.lower() == payload.status.lower()),
        payload.status,
    )

    room.status = normalized_status
    room.updated_at = datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None)
    db.commit()
    db.refresh(room)
    return _format_room_response(room)


@router.patch("/{room_id}", response_model=RoomResponse)
@router.put("/{room_id}", response_model=RoomResponse)
def update_room(
    room_id: str,
    payload: RoomUpdate,
    db: Session = Depends(get_db),
):
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Room with ID '{room_id}' not found",
        )

    if payload.room_number is not None and payload.room_number != room.room_number:
        existing = (
            db.query(Room).filter(Room.room_number == payload.room_number).first()
        )
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Room with number '{payload.room_number}' already exists",
            )
        room.room_number = payload.room_number

    if payload.room_category is not None:
        room.room_category = payload.room_category
    if payload.base_rate_per_night is not None:
        room.base_rate_per_night = payload.base_rate_per_night
    if payload.floor_number is not None:
        room.floor_number = payload.floor_number
    if payload.max_occupancy is not None:
        room.max_occupancy = payload.max_occupancy
    if payload.amenities is not None:
        room.amenities = json.dumps(payload.amenities)
    if payload.status is not None:
        room.status = payload.status

    room.updated_at = datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None)
    db.commit()
    db.refresh(room)
    return _format_room_response(room)


@router.delete("/{room_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_room(
    room_id: str,
    db: Session = Depends(get_db),
):
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Room with ID '{room_id}' not found",
        )

    # Check for active bookings
    active_booking = (
        db.query(Booking)
        .filter(
            Booking.room_id == room_id,
            Booking.booking_status.in_(["Reserved", "Confirmed", "CheckedIn"]),
        )
        .first()
    )
    if active_booking:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cannot delete room with active or upcoming reservations",
        )

    db.delete(room)
    db.commit()
    return None
