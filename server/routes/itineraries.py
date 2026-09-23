from typing import List
from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.orm import Session
from server.database import get_db
from server.schemas import (
    ItineraryGenerateRequest,
    ItineraryUpdateRequest,
    ItineraryResponse,
)
from server.services.itinerary_service import ItineraryService

router = APIRouter()


@router.post(
    "/generate",
    response_model=ItineraryResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Generate AI Travel Itinerary",
)
def generate_itinerary(
    req: ItineraryGenerateRequest,
    db: Session = Depends(get_db),
):
    itinerary = ItineraryService.generate_itinerary(req, db)
    return itinerary


@router.get(
    "/shared/{share_token}",
    response_model=ItineraryResponse,
    summary="Get Shared Itinerary by Share Token",
)
def get_shared_itinerary(
    share_token: str,
    db: Session = Depends(get_db),
):
    return ItineraryService.get_itinerary_by_share_token(share_token, db)


@router.get(
    "",
    response_model=List[ItineraryResponse],
    summary="List All Saved Itineraries",
)
def list_itineraries(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    return ItineraryService.list_itineraries(skip=skip, limit=limit, db=db)


@router.get(
    "/{id}",
    response_model=ItineraryResponse,
    summary="Retrieve Full Itinerary Details",
)
def get_itinerary(
    id: str,
    db: Session = Depends(get_db),
):
    return ItineraryService.get_itinerary_by_id(id, db)


@router.put(
    "/{id}",
    response_model=ItineraryResponse,
    summary="Update Itinerary Metadata and Budget",
)
def update_itinerary(
    id: str,
    req: ItineraryUpdateRequest,
    db: Session = Depends(get_db),
):
    return ItineraryService.update_itinerary(id, req, db)
