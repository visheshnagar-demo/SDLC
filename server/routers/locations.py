from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from server.database import get_db
from server.models import Location
from server.schemas import LocationCreate, LocationResponse

router = APIRouter(prefix="/api/v1/locations", tags=["Locations"])


@router.get("", response_model=List[LocationResponse])
def list_locations(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db)
):
    return db.query(Location).offset(skip).limit(limit).all()


@router.post("", response_model=LocationResponse, status_code=status.HTTP_201_CREATED)
def create_location(
    location_in: LocationCreate,
    db: Session = Depends(get_db)
):
    location = Location(**location_in.model_dump())
    db.add(location)
    db.commit()
    db.refresh(location)
    return location


@router.get("/{id}", response_model=LocationResponse)
def get_location(
    id: str,
    db: Session = Depends(get_db)
):
    location = db.query(Location).filter(Location.id == id).first()
    if not location:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Location with ID '{id}' not found."
        )
    return location
