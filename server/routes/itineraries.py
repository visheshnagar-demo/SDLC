from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from server.database import get_db
from server.schemas import (
    ItineraryGenerateRequest,
    ItineraryUpdateRequest,
    ItineraryResponse,
)
from server.services.itinerary_service import ItineraryService

router = APIRouter(prefix="/api/v1/itineraries", tags=["Itineraries"])


@router.post(
    "/generate", response_model=ItineraryResponse, status_code=status.HTTP_201_CREATED
)
def generate_itinerary(req: ItineraryGenerateRequest, db: Session = Depends(get_db)):
    if req.duration_days < 1 or req.duration_days > 30:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Duration must be between 1 and 30 days",
        )
    if req.budget <= 0:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Budget must be greater than zero",
        )
    return ItineraryService.generate_itinerary(req, db)


@router.get("", response_model=List[ItineraryResponse])
def list_itineraries(skip: int = 0, limit: int = 20, db: Session = Depends(get_db)):
    return ItineraryService.list_itineraries(skip, limit, db)


@router.get("/shared/{share_token}", response_model=ItineraryResponse)
def get_shared_itinerary(share_token: str, db: Session = Depends(get_db)):
    itinerary = ItineraryService.get_shared_itinerary(share_token, db)
    if not itinerary:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shared itinerary not found or invalid token",
        )
    return itinerary


@router.get("/{itinerary_id}", response_model=ItineraryResponse)
def get_itinerary(itinerary_id: str, db: Session = Depends(get_db)):
    itinerary = ItineraryService.get_itinerary(itinerary_id, db)
    if not itinerary:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Itinerary with ID {itinerary_id} not found",
        )
    return itinerary


@router.put("/{itinerary_id}", response_model=ItineraryResponse)
def update_itinerary(
    itinerary_id: str, req: ItineraryUpdateRequest, db: Session = Depends(get_db)
):
    itinerary = ItineraryService.update_itinerary(itinerary_id, req, db)
    if not itinerary:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Itinerary with ID {itinerary_id} not found",
        )
    return itinerary
