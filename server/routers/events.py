"""Event and pass tier discovery endpoints."""
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from server.database import get_db
from server.models import Event, PassTier, User
from server.schemas import (
    EventResponse,
    EventCreate,
    PassTierResponse,
    PassTierCreate,
)
from server.dependencies import get_current_admin, get_optional_user

router = APIRouter(prefix="/events", tags=["Events"])


@router.get("", response_model=List[EventResponse])
def list_events(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
):
    """List all Garba events and dates."""
    events = db.query(Event).offset(skip).limit(limit).all()
    return events


@router.post("", response_model=EventResponse, status_code=status.HTTP_201_CREATED)
def create_event(
    event_in: EventCreate,
    db: Session = Depends(get_db),
    admin: Optional[User] = Depends(get_optional_user),
):
    """Create a new Garba event."""
    event = Event(
        id=str(uuid.uuid4()),
        title=event_in.title,
        description=event_in.description,
        venue_name=event_in.venue_name,
        start_date=event_in.start_date,
        end_date=event_in.end_date,
        status=event_in.status or "ACTIVE",
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return event


@router.get("/{id}", response_model=EventResponse)
def get_event(id: str, db: Session = Depends(get_db)):
    """Get single Garba event details."""
    event = db.query(Event).filter(Event.id == id).first()
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Event with id '{id}' not found.",
        )
    return event


@router.get("/{id}/tiers", response_model=List[PassTierResponse])
def get_event_pass_tiers(id: str, db: Session = Depends(get_db)):
    """List pass tiers (Single-Day, Season, VIP), pricing, and real-time quota for an event."""
    event = db.query(Event).filter(Event.id == id).first()
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Event with id '{id}' not found.",
        )
    tiers = db.query(PassTier).filter(PassTier.event_id == id).all()
    return tiers


@router.post("/{id}/tiers", response_model=PassTierResponse, status_code=status.HTTP_201_CREATED)
def create_event_pass_tier(
    id: str,
    tier_in: PassTierCreate,
    db: Session = Depends(get_db),
    admin: Optional[User] = Depends(get_optional_user),
):
    """Create a new pass tier for an event."""
    event = db.query(Event).filter(Event.id == id).first()
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Event with id '{id}' not found.",
        )

    tier = PassTier(
        id=str(uuid.uuid4()),
        event_id=id,
        tier_name=tier_in.tier_name,
        description=tier_in.description,
        price=tier_in.price,
        total_quota=tier_in.total_quota,
        available_quota=tier_in.available_quota if tier_in.available_quota is not None else tier_in.total_quota,
        valid_from=tier_in.valid_from,
        valid_to=tier_in.valid_to,
    )
    db.add(tier)
    db.commit()
    db.refresh(tier)
    return tier
