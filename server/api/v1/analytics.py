from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from server.database import get_db
from server import models, schemas
from server.services import rainwater_service

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/yield", response_model=List[schemas.YieldAnalyticResponse])
def get_yield_analytics(
    tank_id: Optional[str] = Query(None), db: Session = Depends(get_db)
):
    query = db.query(models.YieldAnalytic)
    if tank_id:
        query = query.filter(models.YieldAnalytic.tank_id == tank_id)
    records = query.order_by(models.YieldAnalytic.recorded_date.desc()).all()
    return records


@router.post(
    "/calculate",
    response_model=schemas.YieldCalculateResponse,
    status_code=status.HTTP_200_OK,
)
def calculate_yield_forecast(request: schemas.YieldCalculateRequest):
    eff = request.efficiency_factor if request.efficiency_factor is not None else 0.9
    harvested = rainwater_service.calculate_yield(
        catchment_area_sqm=request.catchment_area_sqm,
        precipitation_mm=request.precipitation_mm,
        efficiency_factor=eff,
    )
    return schemas.YieldCalculateResponse(
        catchment_area_sqm=request.catchment_area_sqm,
        precipitation_mm=request.precipitation_mm,
        efficiency_factor=eff,
        estimated_harvested_liters=round(harvested, 2),
    )
