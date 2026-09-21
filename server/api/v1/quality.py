from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from server.database import get_db
from server import models, schemas
from server.services import rainwater_service

router = APIRouter(prefix="/quality", tags=["quality"])


@router.get("", response_model=schemas.QualityOverviewResponse)
def get_quality_overview(tank_id: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(models.QualityMetric)
    if tank_id:
        query = query.filter(models.QualityMetric.tank_id == tank_id)

    metrics = query.order_by(models.QualityMetric.timestamp.desc()).limit(20).all()

    if not metrics:
        avg_ph, avg_turb, avg_tds, overall_pass = 7.2, 1.2, 135.0, True
    else:
        avg_ph = float(sum(m.ph_level for m in metrics) / len(metrics))
        avg_turb = float(sum(m.turbidity_ntu for m in metrics) / len(metrics))
        avg_tds = float(sum(m.tds_ppm for m in metrics) / len(metrics))
        overall_pass = all(m.pass_status for m in metrics)

    backwash_query = db.query(models.BackwashLog)
    if tank_id:
        backwash_query = backwash_query.filter(models.BackwashLog.tank_id == tank_id)
    recent_backwashes = (
        backwash_query.order_by(models.BackwashLog.timestamp.desc()).limit(10).all()
    )

    backwash_logs_list = [
        {
            "id": bw.id,
            "tank_id": bw.tank_id,
            "unit_name": bw.unit_name,
            "status": bw.status,
            "triggered_by": bw.triggered_by,
            "timestamp": bw.timestamp.isoformat() if bw.timestamp else None,
            "notes": bw.notes,
        }
        for bw in recent_backwashes
    ]

    return schemas.QualityOverviewResponse(
        average_ph=round(avg_ph, 2),
        average_turbidity_ntu=round(avg_turb, 2),
        average_tds_ppm=round(avg_tds, 1),
        overall_pass_status=overall_pass,
        active_filtration_units=3,
        recent_backwashes_count=len(recent_backwashes),
        metrics=metrics,
        recent_backwash_logs=backwash_logs_list,
    )


@router.post(
    "/backwash", response_model=schemas.BackwashResponse, status_code=status.HTTP_200_OK
)
def trigger_backwash(request: schemas.BackwashRequest, db: Session = Depends(get_db)):
    tank = rainwater_service.get_tank_by_id(db, request.tank_id)
    if not tank:
        raise HTTPException(
            status_code=404, detail=f"Tank with ID '{request.tank_id}' not found."
        )

    bw_log = rainwater_service.trigger_backwash(db, request)

    return schemas.BackwashResponse(
        id=bw_log.id,
        tank_id=bw_log.tank_id,
        unit_name=bw_log.unit_name,
        status=bw_log.status,
        triggered_by=bw_log.triggered_by,
        timestamp=bw_log.timestamp,
        message=f"Filter backwash cycle successfully triggered for unit '{bw_log.unit_name}' on tank '{tank.name}'.",
    )
