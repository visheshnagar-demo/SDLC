import uuid
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from server import models, schemas
from server.database import get_db

router = APIRouter(prefix="/api/v1/tanks", tags=["Tanks"])


@router.get("", response_model=List[schemas.TankResponse])
def list_tanks(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    tanks = db.query(models.Tank).offset(skip).limit(limit).all()
    return tanks


@router.post("", response_model=schemas.TankResponse, status_code=status.HTTP_201_CREATED)
def create_tank(
    tank_in: schemas.TankCreate,
    db: Session = Depends(get_db),
):
    now = datetime.now(timezone.utc)
    tank = models.Tank(
        id=str(uuid.uuid4()),
        name=tank_in.name,
        location=tank_in.location,
        capacity_liters=tank_in.capacity_liters,
        water_type=tank_in.water_type,
        created_at=now,
        updated_at=now,
    )
    db.add(tank)
    db.commit()
    db.refresh(tank)

    # Automatically set default thresholds for new tank
    default_limits = {
        "Saltwater": {"ph_level": (8.0, 8.4), "dissolved_oxygen": (6.5, 8.5), "temperature_c": (24.0, 26.5), "ammonia_ppm": (0.0, 0.02)},
        "Freshwater": {"ph_level": (6.5, 7.5), "dissolved_oxygen": (6.0, 9.0), "temperature_c": (23.0, 27.0), "ammonia_ppm": (0.0, 0.05)},
        "Reef": {"ph_level": (8.1, 8.4), "dissolved_oxygen": (6.8, 8.5), "temperature_c": (25.0, 26.5), "ammonia_ppm": (0.0, 0.01)},
    }
    limits = default_limits.get(tank.water_type, default_limits["Freshwater"])
    for param, (min_v, max_v) in limits.items():
        thresh = models.AlertThreshold(
            id=str(uuid.uuid4()),
            tank_id=tank.id,
            parameter_name=param,
            min_threshold=min_v,
            max_threshold=max_v,
            is_active=True,
            created_at=now,
            updated_at=now,
        )
        db.add(thresh)
    db.commit()

    return tank


@router.get("/{id}", response_model=schemas.TankResponse)
def get_tank(
    id: str,
    db: Session = Depends(get_db),
):
    tank = db.query(models.Tank).filter(models.Tank.id == id).first()
    if not tank:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Tank with id '{id}' not found",
        )
    return tank


@router.patch("/{id}", response_model=schemas.TankResponse)
def update_tank(
    id: str,
    tank_in: schemas.TankUpdate,
    db: Session = Depends(get_db),
):
    tank = db.query(models.Tank).filter(models.Tank.id == id).first()
    if not tank:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Tank with id '{id}' not found",
        )

    update_data = tank_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(tank, key, value)
    tank.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(tank)
    return tank


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_tank(
    id: str,
    db: Session = Depends(get_db),
):
    tank = db.query(models.Tank).filter(models.Tank.id == id).first()
    if not tank:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Tank with id '{id}' not found",
        )
    db.delete(tank)
    db.commit()
    return None
