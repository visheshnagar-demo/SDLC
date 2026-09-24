from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from server.database import get_db
from server.schemas import EnvironmentalReadingCreate, EnvironmentalReadingResponse
from server.services.environmental_service import EnvironmentalService

router = APIRouter(prefix="/api/v1/environmental-readings", tags=["Environmental Telemetry"])


@router.get("", response_model=List[EnvironmentalReadingResponse])
def list_readings(
    location_id: Optional[str] = Query(None, description="Filter readings by location ID"),
    is_breach: Optional[bool] = Query(None, description="Filter only breach readings"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db)
):
    return EnvironmentalService.get_readings(
        db=db,
        location_id=location_id,
        is_breach=is_breach,
        skip=skip,
        limit=limit
    )


@router.post("", response_model=EnvironmentalReadingResponse, status_code=status.HTTP_201_CREATED)
def ingest_reading(
    reading_in: EnvironmentalReadingCreate,
    db: Session = Depends(get_db)
):
    return EnvironmentalService.ingest_reading(db=db, reading_in=reading_in)


@router.get("/summary/sensor-status", response_model=Dict[str, Any])
def get_sensor_status_summary(
    db: Session = Depends(get_db)
):
    return EnvironmentalService.get_sensor_summary(db=db)
