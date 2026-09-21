from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from server.database import get_db
from server import models, schemas
from server.services import rainwater_service

router = APIRouter(prefix="/tanks", tags=["tanks"])


@router.get("", response_model=List[schemas.TankResponse])
def list_tanks(db: Session = Depends(get_db)):
    tanks = rainwater_service.get_all_tanks(db)
    results = []
    for tank in tanks:
        fill_pct = (
            (tank.current_volume_liters / tank.total_capacity_liters) * 100.0
            if tank.total_capacity_liters > 0
            else 0.0
        )
        resp = schemas.TankResponse(
            id=str(tank.id),
            name=str(tank.name),
            location=str(tank.location),
            total_capacity_liters=float(tank.total_capacity_liters),
            current_volume_liters=float(tank.current_volume_liters),
            fill_percentage=round(fill_pct, 1),
            net_inflow_rate_lpm=float(tank.net_inflow_rate_lpm),
            net_outflow_rate_lpm=float(tank.net_outflow_rate_lpm),
            status=str(tank.status),
            supply_pump_active=bool(tank.supply_pump_active),
            overflow_valve_open=bool(tank.overflow_valve_open),
            municipal_backup_active=bool(tank.municipal_backup_active),
            clean_valve_open=bool(tank.clean_valve_open),
            pump_operating_hours=float(tank.pump_operating_hours),
            created_at=tank.created_at,
            updated_at=tank.updated_at,
        )
        results.append(resp)
    return results


@router.post(
    "", response_model=schemas.TankResponse, status_code=status.HTTP_201_CREATED
)
def create_or_update_tank(tank_in: schemas.TankCreate, db: Session = Depends(get_db)):
    tank = rainwater_service.create_tank(db, tank_in)
    fill_pct = (
        (tank.current_volume_liters / tank.total_capacity_liters) * 100.0
        if tank.total_capacity_liters > 0
        else 0.0
    )
    return schemas.TankResponse(
        id=str(tank.id),
        name=str(tank.name),
        location=str(tank.location),
        total_capacity_liters=float(tank.total_capacity_liters),
        current_volume_liters=float(tank.current_volume_liters),
        fill_percentage=round(fill_pct, 1),
        net_inflow_rate_lpm=float(tank.net_inflow_rate_lpm),
        net_outflow_rate_lpm=float(tank.net_outflow_rate_lpm),
        status=str(tank.status),
        supply_pump_active=bool(tank.supply_pump_active),
        overflow_valve_open=bool(tank.overflow_valve_open),
        municipal_backup_active=bool(tank.municipal_backup_active),
        clean_valve_open=bool(tank.clean_valve_open),
        pump_operating_hours=float(tank.pump_operating_hours),
        created_at=tank.created_at,
        updated_at=tank.updated_at,
    )


@router.get("/{tank_id}/status", response_model=schemas.TankStatusResponse)
def get_tank_status(tank_id: str, db: Session = Depends(get_db)):
    tank = rainwater_service.get_tank_by_id(db, tank_id)
    if not tank:
        raise HTTPException(
            status_code=404, detail=f"Tank with ID '{tank_id}' not found."
        )

    latest_telemetry = (
        db.query(models.TelemetryLog)
        .filter(models.TelemetryLog.tank_id == tank_id)
        .order_by(models.TelemetryLog.timestamp.desc())
        .first()
    )

    fill_pct = (
        (tank.current_volume_liters / tank.total_capacity_liters) * 100.0
        if tank.total_capacity_liters > 0
        else 0.0
    )

    hp = (
        float(latest_telemetry.head_pressure_psi)
        if (latest_telemetry and latest_telemetry.head_pressure_psi is not None)
        else 35.0
    )
    wt = (
        float(latest_telemetry.water_temp_c)
        if (latest_telemetry and latest_telemetry.water_temp_c is not None)
        else 18.5
    )
    ph = (
        float(latest_telemetry.ph_level)
        if (latest_telemetry and latest_telemetry.ph_level is not None)
        else 7.2
    )
    turb = (
        float(latest_telemetry.turbidity_ntu)
        if (latest_telemetry and latest_telemetry.turbidity_ntu is not None)
        else 1.2
    )
    tds = (
        float(latest_telemetry.tds_ppm)
        if (latest_telemetry and latest_telemetry.tds_ppm is not None)
        else 135.0
    )

    return schemas.TankStatusResponse(
        tank_id=str(tank.id),
        name=str(tank.name),
        total_capacity_liters=float(tank.total_capacity_liters),
        current_volume_liters=float(tank.current_volume_liters),
        fill_percentage=round(fill_pct, 1),
        net_inflow_rate_lpm=float(tank.net_inflow_rate_lpm),
        net_outflow_rate_lpm=float(tank.net_outflow_rate_lpm),
        status=str(tank.status),
        head_pressure_psi=hp,
        water_temp_c=wt,
        ph_level=ph,
        turbidity_ntu=turb,
        tds_ppm=tds,
        supply_pump_active=bool(tank.supply_pump_active),
        overflow_valve_open=bool(tank.overflow_valve_open),
        municipal_backup_active=bool(tank.municipal_backup_active),
        clean_valve_open=bool(tank.clean_valve_open),
        pump_operating_hours=float(tank.pump_operating_hours),
    )
