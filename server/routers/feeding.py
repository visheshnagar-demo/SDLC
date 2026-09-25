import uuid
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from server import models, schemas
from server.database import get_db

router = APIRouter(prefix="/api/v1/feeding", tags=["Feeding"])


# -------------------- Schedules --------------------
@router.get("/schedules", response_model=List[schemas.FeedingScheduleResponse])
def get_feeding_schedules(
    tank_id: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    db: Session = Depends(get_db),
):
    query = db.query(models.FeedingSchedule)
    if tank_id:
        query = query.filter(models.FeedingSchedule.tank_id == tank_id)
    if is_active is not None:
        query = query.filter(models.FeedingSchedule.is_active == is_active)
    return query.order_by(models.FeedingSchedule.scheduled_time.asc()).all()


@router.post("/schedules", response_model=schemas.FeedingScheduleResponse, status_code=status.HTTP_201_CREATED)
def create_feeding_schedule(
    schedule_in: schemas.FeedingScheduleCreate,
    db: Session = Depends(get_db),
):
    tank = db.query(models.Tank).filter(models.Tank.id == schedule_in.tank_id).first()
    if not tank:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Tank with id '{schedule_in.tank_id}' not found",
        )

    now = datetime.now(timezone.utc)
    schedule = models.FeedingSchedule(
        id=str(uuid.uuid4()),
        tank_id=schedule_in.tank_id,
        food_type=schedule_in.food_type,
        portion_grams=schedule_in.portion_grams,
        frequency=schedule_in.frequency,
        scheduled_time=schedule_in.scheduled_time,
        is_active=schedule_in.is_active,
        created_at=now,
        updated_at=now,
    )
    db.add(schedule)
    db.commit()
    db.refresh(schedule)
    return schedule


@router.delete("/schedules/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_feeding_schedule(
    id: str,
    db: Session = Depends(get_db),
):
    schedule = db.query(models.FeedingSchedule).filter(models.FeedingSchedule.id == id).first()
    if not schedule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Feeding schedule with id '{id}' not found",
        )
    db.delete(schedule)
    db.commit()
    return None


# -------------------- Logs --------------------
@router.get("/logs", response_model=List[schemas.FeedingLogResponse])
def get_feeding_logs(
    tank_id: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    query = db.query(models.FeedingLog)
    if tank_id:
        query = query.filter(models.FeedingLog.tank_id == tank_id)
    logs = (
        query.order_by(models.FeedingLog.fed_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return logs


@router.post("/logs", response_model=schemas.FeedingLogResponse, status_code=status.HTTP_201_CREATED)
def record_feeding_log(
    log_in: schemas.FeedingLogCreate,
    db: Session = Depends(get_db),
):
    tank = db.query(models.Tank).filter(models.Tank.id == log_in.tank_id).first()
    if not tank:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Tank with id '{log_in.tank_id}' not found",
        )

    if log_in.schedule_id:
        schedule = (
            db.query(models.FeedingSchedule)
            .filter(models.FeedingSchedule.id == log_in.schedule_id)
            .first()
        )
        if not schedule:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Feeding schedule with id '{log_in.schedule_id}' not found",
            )

    now = datetime.now(timezone.utc)
    fed_at = log_in.fed_at or now

    log = models.FeedingLog(
        id=str(uuid.uuid4()),
        tank_id=log_in.tank_id,
        schedule_id=log_in.schedule_id,
        food_type=log_in.food_type,
        portion_grams=log_in.portion_grams,
        fed_by=log_in.fed_by,
        fed_at=fed_at,
        notes=log_in.notes,
        created_at=now,
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return log
