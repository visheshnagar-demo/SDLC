from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from server.database import get_db
from server.schemas import (
    ActivityCreate,
    ActivityUpdate,
    ActivityResponse,
    ActivityReorderRequest,
    ItineraryResponse,
)
from server.services.itinerary_service import ItineraryService

router = APIRouter(
    prefix="/api/v1/itineraries/{itinerary_id}/activities", tags=["Activities"]
)


@router.post("", response_model=ActivityResponse, status_code=status.HTTP_201_CREATED)
def add_activity(itinerary_id: str, req: ActivityCreate, db: Session = Depends(get_db)):
    return ItineraryService.add_activity(itinerary_id, req, db)


@router.put("/{activity_id}", response_model=ActivityResponse)
def update_activity(
    itinerary_id: str,
    activity_id: str,
    req: ActivityUpdate,
    db: Session = Depends(get_db),
):
    activity = ItineraryService.update_activity(itinerary_id, activity_id, req, db)
    if not activity:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Activity with ID {activity_id} not found in itinerary {itinerary_id}",
        )
    return activity


@router.delete("/{activity_id}", status_code=status.HTTP_200_OK)
def delete_activity(
    itinerary_id: str, activity_id: str, db: Session = Depends(get_db)
) -> Dict[str, Any]:
    result = ItineraryService.delete_activity(itinerary_id, activity_id, db)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Activity with ID {activity_id} not found in itinerary {itinerary_id}",
        )
    return result


@router.post("/reorder", response_model=ItineraryResponse)
def reorder_activities(
    itinerary_id: str, req: ActivityReorderRequest, db: Session = Depends(get_db)
):
    return ItineraryService.reorder_activities(itinerary_id, req, db)
