import uuid
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from server import models, schemas
from server.database import get_db

router = APIRouter(tags=["Alerts & Thresholds"])


# -------------------- Thresholds --------------------
@router.get("/api/v1/thresholds", response_model=List[schemas.AlertThresholdResponse])
def get_thresholds(
    tank_id: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    query = db.query(models.AlertThreshold)
    if tank_id:
        query = query.filter(models.AlertThreshold.tank_id == tank_id)
    return query.all()


@router.post("/api/v1/thresholds", response_model=schemas.AlertThresholdResponse, status_code=status.HTTP_201_CREATED)
def set_threshold(
    threshold_in: schemas.AlertThresholdCreate,
    db: Session = Depends(get_db),
):
    tank = db.query(models.Tank).filter(models.Tank.id == threshold_in.tank_id).first()
    if not tank:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Tank with id '{threshold_in.tank_id}' not found",
        )

    if threshold_in.min_threshold >= threshold_in.max_threshold:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="min_threshold must be strictly less than max_threshold",
        )

    now = datetime.now(timezone.utc)
    # Check if threshold already exists for this tank + parameter
    existing = (
        db.query(models.AlertThreshold)
        .filter(
            models.AlertThreshold.tank_id == threshold_in.tank_id,
            models.AlertThreshold.parameter_name == threshold_in.parameter_name,
        )
        .first()
    )

    if existing:
        existing.min_threshold = threshold_in.min_threshold
        existing.max_threshold = threshold_in.max_threshold
        existing.is_active = threshold_in.is_active
        existing.updated_at = now
        db.commit()
        db.refresh(existing)
        return existing

    threshold = models.AlertThreshold(
        id=str(uuid.uuid4()),
        tank_id=threshold_in.tank_id,
        parameter_name=threshold_in.parameter_name,
        min_threshold=threshold_in.min_threshold,
        max_threshold=threshold_in.max_threshold,
        is_active=threshold_in.is_active,
        created_at=now,
        updated_at=now,
    )
    db.add(threshold)
    db.commit()
    db.refresh(threshold)
    return threshold


# -------------------- Alerts --------------------
@router.get("/api/v1/alerts", response_model=List[schemas.AlertResponse])
def get_alerts(
    tank_id: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    severity: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    query = db.query(models.Alert)
    if tank_id:
        query = query.filter(models.Alert.tank_id == tank_id)
    if status_filter:
        query = query.filter(models.Alert.status == status_filter)
    if severity:
        query = query.filter(models.Alert.severity == severity)

    alerts = (
        query.order_by(models.Alert.triggered_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return alerts


@router.patch("/api/v1/alerts/{id}/status", response_model=schemas.AlertResponse)
def update_alert_status(
    id: str,
    status_in: schemas.AlertStatusUpdate,
    db: Session = Depends(get_db),
):
    alert = db.query(models.Alert).filter(models.Alert.id == id).first()
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Alert with id '{id}' not found",
        )

    now = datetime.now(timezone.utc)
    alert.status = status_in.status
    if status_in.status == "ACKNOWLEDGED":
        alert.acknowledged_at = now
    elif status_in.status == "RESOLVED":
        alert.resolved_at = now
        if not alert.acknowledged_at:
            alert.acknowledged_at = now

    alert.updated_at = now
    db.commit()
    db.refresh(alert)
    return alert
