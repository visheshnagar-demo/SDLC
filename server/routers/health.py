import uuid
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from server import models, schemas
from server.database import get_db

router = APIRouter(prefix="/api/v1/health-records", tags=["Fish Health"])


@router.get("", response_model=List[schemas.FishHealthRecordResponse])
def get_health_records(
    tank_id: Optional[str] = Query(None),
    is_quarantined: Optional[bool] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    query = db.query(models.FishHealthRecord)
    if tank_id:
        query = query.filter(models.FishHealthRecord.tank_id == tank_id)
    if is_quarantined is not None:
        query = query.filter(models.FishHealthRecord.is_quarantined == is_quarantined)

    records = (
        query.order_by(models.FishHealthRecord.recorded_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return records


@router.post("", response_model=schemas.FishHealthRecordResponse, status_code=status.HTTP_201_CREATED)
def create_health_record(
    record_in: schemas.FishHealthRecordCreate,
    db: Session = Depends(get_db),
):
    tank = db.query(models.Tank).filter(models.Tank.id == record_in.tank_id).first()
    if not tank:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Tank with id '{record_in.tank_id}' not found",
        )

    now = datetime.now(timezone.utc)
    recorded_at = record_in.recorded_at or now

    record = models.FishHealthRecord(
        id=str(uuid.uuid4()),
        tank_id=record_in.tank_id,
        species=record_in.species,
        population_count=record_in.population_count,
        health_status=record_in.health_status,
        symptoms=record_in.symptoms,
        treatment_notes=record_in.treatment_notes,
        is_quarantined=record_in.is_quarantined,
        recorded_by=record_in.recorded_by,
        recorded_at=recorded_at,
        created_at=now,
        updated_at=now,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@router.get("/{id}", response_model=schemas.FishHealthRecordResponse)
def get_health_record(
    id: str,
    db: Session = Depends(get_db),
):
    record = db.query(models.FishHealthRecord).filter(models.FishHealthRecord.id == id).first()
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Fish health record with id '{id}' not found",
        )
    return record


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_health_record(
    id: str,
    db: Session = Depends(get_db),
):
    record = db.query(models.FishHealthRecord).filter(models.FishHealthRecord.id == id).first()
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Fish health record with id '{id}' not found",
        )
    db.delete(record)
    db.commit()
    return None
