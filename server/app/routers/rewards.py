"""Rewards, badges, and streaks router."""

from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from server.app.database import get_db
from server.app import models, schemas
from server.app.services import reward_service

router = APIRouter(prefix="/api/v1/rewards", tags=["Rewards"])


@router.get("/badges", response_model=List[schemas.BadgeResponse])
def get_badges_endpoint(
    child_id: Optional[str] = Query(None, description="Child profile UUID"),
    db: Session = Depends(get_db),
):
    if not child_id:
        first_child = db.query(models.Child).first()
        child_id = first_child.id if first_child else ""

    badges = reward_service.get_child_badges(db, child_id)
    return badges


@router.get("/streak", response_model=schemas.StreakResponse)
def get_streak_endpoint(
    child_id: Optional[str] = Query(None, description="Child profile UUID"),
    db: Session = Depends(get_db),
):
    if not child_id:
        first_child = db.query(models.Child).first()
        child_id = first_child.id if first_child else ""

    return reward_service.get_child_streak(db, child_id)
