import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from server.database import get_db
from server import models, schemas

router = APIRouter(prefix="/alerts", tags=["alerts"])


@router.get("", response_model=List[schemas.AlertResponse])
def list_alerts(
    tank_id: Optional[str] = Query(None),
    is_acknowledged: Optional[bool] = Query(None),
    severity: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    query = db.query(models.Alert)
    if tank_id:
        query = query.filter(models.Alert.tank_id == tank_id)
    if is_acknowledged is not None:
        query = query.filter(models.Alert.is_acknowledged == is_acknowledged)
    if severity:
        query = query.filter(models.Alert.severity == severity.upper())

    alerts = query.order_by(models.Alert.created_at.desc()).all()
    return alerts


@router.post(
    "", response_model=schemas.AlertResponse, status_code=status.HTTP_201_CREATED
)
def create_alert(alert_in: schemas.AlertCreate, db: Session = Depends(get_db)):
    now = datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None)
    alert = models.Alert(
        tank_id=alert_in.tank_id,
        severity=alert_in.severity.upper(),
        category=alert_in.category.upper(),
        message=alert_in.message,
        is_acknowledged=False,
        created_at=now,
        updated_at=now,
    )
    db.add(alert)
    db.commit()
    db.refresh(alert)
    return alert


@router.post("/{alert_id}/acknowledge", response_model=schemas.AlertResponse)
def acknowledge_alert(
    alert_id: str,
    body: Optional[schemas.AlertAcknowledgeRequest] = None,
    db: Session = Depends(get_db),
):
    alert = db.query(models.Alert).filter(models.Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(
            status_code=404, detail=f"Alert with ID '{alert_id}' not found."
        )

    alert.is_acknowledged = body.is_acknowledged if body else True
    alert.updated_at = datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None)
    db.commit()
    db.refresh(alert)
    return alert
