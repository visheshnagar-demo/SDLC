"""Meals router for logging and viewing meals."""

from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from server.app.database import get_db
from server.app import models, schemas
from server.app.services import meal_service

router = APIRouter(prefix="/api/v1/meals", tags=["Meals"])


@router.post(
    "", response_model=schemas.MealCreateResponse, status_code=status.HTTP_201_CREATED
)
def log_meal_endpoint(
    request: schemas.MealCreateRequest,
    db: Session = Depends(get_db),
):
    return meal_service.log_meal(db, request)


@router.get("", response_model=List[schemas.MealResponse])
def get_meals_endpoint(
    child_id: Optional[str] = Query(None, description="Child profile UUID"),
    date: Optional[str] = Query(None, description="Date in YYYY-MM-DD format"),
    db: Session = Depends(get_db),
):
    if not child_id:
        # Default to first child if not specified
        first_child = db.query(models.Child).first()
        if not first_child:
            return []
        child_id = first_child.id

    meals = meal_service.get_meals_for_child(db, child_id, target_date=date)
    return [schemas.MealResponse.model_validate(m) for m in meals]
