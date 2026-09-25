import uuid
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from server import models, schemas
from server.database import get_db
from server.alert_engine import evaluate_telemetry, get_latest_telemetry_status

router = APIRouter(prefix="/api/v1/telemetry", tags=["Telemetry"])


@router.post("", response_model=schemas.TelemetryReadingResponse, status_code=status.HTTP_201_CREATED)
def ingest_telemetry(
    reading_in: schemas.TelemetryReadingCreate,
    db: Session = Depends(get_db),
):
    tank = db.query(models.Tank).filter(models.Tank.id == reading_in.tank_id).first()
    if not tank:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Tank with id '{reading_in.tank_id}' not found",
        )

    now = datetime.now(timezone.utc)
    recorded_at = reading_in.recorded_at or now

    reading = models.TelemetryReading(
        id=str(uuid.uuid4()),
        tank_id=reading_in.tank_id,
        ph_level=reading_in.ph_level,
        dissolved_oxygen=reading_in.dissolved_oxygen,
        temperature_c=reading_in.temperature_c,
        ammonia_ppm=reading_in.ammonia_ppm,
        recorded_at=recorded_at,
        created_at=now,
    )
    db.add(reading)
    db.commit()
    db.refresh(reading)

    # Evaluate telemetry against thresholds and create alerts if violated
    evaluate_telemetry(db, reading)

    return reading


@router.get("", response_model=List[schemas.TelemetryReadingResponse])
def get_telemetry(
    tank_id: Optional[str] = Query(None),
    start_time: Optional[datetime] = Query(None),
    end_time: Optional[datetime] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    query = db.query(models.TelemetryReading)
    if tank_id:
        query = query.filter(models.TelemetryReading.tank_id == tank_id)
    if start_time:
        query = query.filter(models.TelemetryReading.recorded_at >= start_time)
    if end_time:
        query = query.filter(models.TelemetryReading.recorded_at <= end_time)

    readings = (
        query.order_by(models.TelemetryReading.recorded_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return readings


@router.get("/latest", response_model=schemas.LatestTelemetryResponse)
def get_latest_telemetry(
    tank_id: str = Query(...),
    db: Session = Depends(get_db),
):
    tank = db.query(models.Tank).filter(models.Tank.id == tank_id).first()
    if not tank:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Tank with id '{tank_id}' not found",
        )

    latest_reading = (
        db.query(models.TelemetryReading)
        .filter(models.TelemetryReading.tank_id == tank_id)
        .order_by(models.TelemetryReading.recorded_at.desc())
        .first()
    )

    if not latest_reading:
        return schemas.LatestTelemetryResponse(
            tank_id=tank_id,
            reading=None,
            ph_status="SAFE",
            oxygen_status="SAFE",
            temperature_status="SAFE",
            ammonia_status="SAFE",
        )

    statuses = get_latest_telemetry_status(db, tank_id, latest_reading)

    return schemas.LatestTelemetryResponse(
        tank_id=tank_id,
        reading=schemas.TelemetryReadingResponse.model_validate(latest_reading),
        ph_status=statuses["ph_status"],
        oxygen_status=statuses["oxygen_status"],
        temperature_status=statuses["temperature_status"],
        ammonia_status=statuses["ammonia_status"],
    )
