"""Router for Learner Availability Profile endpoints."""

import uuid
from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from server.database import get_db
from server.models.availability import AvailabilityProfile
from server.schemas.availability import AvailabilityBatchCreate, AvailabilityResponse

router = APIRouter(prefix="/api/v1/availability", tags=["Availability"])


@router.get(
    "", response_model=List[AvailabilityResponse], status_code=status.HTTP_200_OK
)
def get_availability_profile(db: Session = Depends(get_db)):
    """Retrieve the current weekly availability settings."""
    return db.query(AvailabilityProfile).order_by(AvailabilityProfile.day_of_week).all()


@router.post(
    "", response_model=List[AvailabilityResponse], status_code=status.HTTP_200_OK
)
def set_availability_profile(
    payload: AvailabilityBatchCreate, db: Session = Depends(get_db)
):
    """Save or update weekly study time availability by day of week."""
    now = datetime.now(timezone.utc)
    results = []

    for slot in payload.weekly_slots:
        day_normalized = slot.day_of_week.upper()
        existing = (
            db.query(AvailabilityProfile)
            .filter(AvailabilityProfile.day_of_week == day_normalized)
            .first()
        )
        if existing:
            existing.available_minutes = slot.available_minutes
            existing.preferred_time_of_day = slot.preferred_time_of_day
            existing.updated_at = now
            results.append(existing)
        else:
            new_profile = AvailabilityProfile(
                id=str(uuid.uuid4()),
                day_of_week=day_normalized,
                available_minutes=slot.available_minutes,
                preferred_time_of_day=slot.preferred_time_of_day,
                created_at=now,
                updated_at=now,
            )
            db.add(new_profile)
            results.append(new_profile)

    db.commit()
    for item in results:
        db.refresh(item)
    return results
