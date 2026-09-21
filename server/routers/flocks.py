from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from server.database import get_db
from server.models import Flock
from server.schemas import (
    FlockCreate,
    FlockUpdate,
    FlockStatusUpdate,
    FlockResponse,
)

router = APIRouter(prefix="/flocks", tags=["Flocks"])


@router.post("", response_model=FlockResponse, status_code=status.HTTP_201_CREATED)
def create_flock(flock_in: FlockCreate, db: Session = Depends(get_db)):
    if flock_in.initial_count <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Initial hen count must be greater than zero.",
        )

    flock = Flock(
        name=flock_in.name,
        breed=flock_in.breed,
        hatch_date=flock_in.hatch_date,
        initial_count=flock_in.initial_count,
        active_count=flock_in.initial_count,
        coop_location=flock_in.coop_location,
        status="ACTIVE",
    )
    db.add(flock)
    db.commit()
    db.refresh(flock)
    return flock


@router.get("", response_model=List[FlockResponse])
def list_flocks(
    status_filter: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    query = db.query(Flock)
    if status_filter:
        query = query.filter(Flock.status == status_filter)
    flocks = query.offset(skip).limit(limit).all()
    return flocks


@router.get("/{flock_id}", response_model=FlockResponse)
def get_flock(flock_id: str, db: Session = Depends(get_db)):
    flock = db.query(Flock).filter(Flock.id == flock_id).first()
    if not flock:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Flock not found",
        )
    return flock


@router.put("/{flock_id}", response_model=FlockResponse)
def update_flock(
    flock_id: str, flock_in: FlockUpdate, db: Session = Depends(get_db)
):
    flock = db.query(Flock).filter(Flock.id == flock_id).first()
    if not flock:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Flock not found",
        )

    if flock_in.name is not None:
        flock.name = flock_in.name
    if flock_in.breed is not None:
        flock.breed = flock_in.breed
    if flock_in.hatch_date is not None:
        flock.hatch_date = flock_in.hatch_date
    if flock_in.coop_location is not None:
        flock.coop_location = flock_in.coop_location
    if flock_in.status is not None:
        flock.status = flock_in.status

    db.commit()
    db.refresh(flock)
    return flock


@router.patch("/{flock_id}/status", response_model=FlockResponse)
def update_flock_status(
    flock_id: str, status_in: FlockStatusUpdate, db: Session = Depends(get_db)
):
    flock = db.query(Flock).filter(Flock.id == flock_id).first()
    if not flock:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Flock not found",
        )

    flock.status = status_in.status
    db.commit()
    db.refresh(flock)
    return flock
