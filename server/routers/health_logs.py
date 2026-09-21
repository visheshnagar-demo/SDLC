from typing import Optional, List
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from server.database import get_db
from server.models import Flock, HealthMortalityLog
from server.schemas import HealthLogCreate, HealthLogResponse

router = APIRouter(prefix="/health-logs", tags=["Health & Mortality Logs"])


@router.post("", response_model=HealthLogResponse, status_code=status.HTTP_201_CREATED)
def record_health_log(
    log_in: HealthLogCreate, db: Session = Depends(get_db)
):
    flock = db.query(Flock).filter(Flock.id == log_in.flock_id).first()
    if not flock:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Flock not found",
        )

    log_type_upper = log_in.log_type.upper()

    if log_type_upper == "MORTALITY":
        if log_in.quantity > flock.active_count:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Mortality exceeds active hen count",
            )
        flock.active_count -= log_in.quantity

    health_log = HealthMortalityLog(
        flock_id=log_in.flock_id,
        log_date=log_in.log_date,
        log_type=log_type_upper,
        quantity=log_in.quantity,
        notes=log_in.notes,
    )
    db.add(health_log)
    db.commit()
    db.refresh(health_log)
    db.refresh(flock)

    resp = HealthLogResponse.model_validate(health_log)
    resp.updated_active_hen_count = flock.active_count
    return resp


@router.get("", response_model=List[HealthLogResponse])
def list_health_logs(
    flock_id: Optional[str] = None,
    log_type: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    query = db.query(HealthMortalityLog)
    if flock_id:
        query = query.filter(HealthMortalityLog.flock_id == flock_id)
    if log_type:
        query = query.filter(HealthMortalityLog.log_type == log_type.upper())
    if start_date:
        query = query.filter(HealthMortalityLog.log_date >= start_date)
    if end_date:
        query = query.filter(HealthMortalityLog.log_date <= end_date)

    logs = (
        query.order_by(HealthMortalityLog.log_date.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

    res = []
    for log in logs:
        flock = db.query(Flock).filter(Flock.id == log.flock_id).first()
        r = HealthLogResponse.model_validate(log)
        if flock:
            r.updated_active_hen_count = flock.active_count
        res.append(r)
    return res
