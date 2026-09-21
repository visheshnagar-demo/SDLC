import datetime
from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from server import models, schemas


def get_all_tanks(db: Session) -> List[models.Tank]:
    return db.query(models.Tank).all()


def get_tank_by_id(db: Session, tank_id: str) -> Optional[models.Tank]:
    return db.query(models.Tank).filter(models.Tank.id == tank_id).first()


def create_tank(db: Session, tank_in: schemas.TankCreate) -> models.Tank:
    now = datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None)
    tank = models.Tank(
        name=tank_in.name,
        location=tank_in.location,
        total_capacity_liters=tank_in.total_capacity_liters,
        current_volume_liters=tank_in.current_volume_liters or 0.0,
        net_inflow_rate_lpm=0.0,
        net_outflow_rate_lpm=0.0,
        status="ACTIVE",
        supply_pump_active=(tank_in.current_volume_liters or 0.0)
        > 0.3 * tank_in.total_capacity_liters,
        overflow_valve_open=(tank_in.current_volume_liters or 0.0)
        > 0.98 * tank_in.total_capacity_liters,
        municipal_backup_active=(tank_in.current_volume_liters or 0.0)
        < 0.10 * tank_in.total_capacity_liters,
        clean_valve_open=True,
        pump_operating_hours=0.0,
        created_at=now,
        updated_at=now,
    )
    db.add(tank)
    db.commit()
    db.refresh(tank)
    return tank


def update_tank(
    db: Session, tank_id: str, tank_in: schemas.TankUpdate
) -> Optional[models.Tank]:
    tank = get_tank_by_id(db, tank_id)
    if not tank:
        return None

    if tank_in.name is not None:
        tank.name = tank_in.name
    if tank_in.location is not None:
        tank.location = tank_in.location
    if tank_in.total_capacity_liters is not None:
        tank.total_capacity_liters = tank_in.total_capacity_liters
    if tank_in.current_volume_liters is not None:
        tank.current_volume_liters = tank_in.current_volume_liters
    if tank_in.status is not None:
        tank.status = tank_in.status

    tank.updated_at = datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None)
    db.commit()
    db.refresh(tank)
    return tank


def process_telemetry(
    db: Session, telemetry_in: schemas.TelemetryIngest
) -> Tuple[models.TelemetryLog, models.Tank]:
    now = datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None)
    tank = get_tank_by_id(db, telemetry_in.tank_id)
    if not tank:
        # Create tank if not found
        tank = models.Tank(
            id=telemetry_in.tank_id,
            name=f"Tank {telemetry_in.tank_id}",
            location="Default Location",
            total_capacity_liters=10000.0,
            current_volume_liters=telemetry_in.water_level_liters,
            net_inflow_rate_lpm=telemetry_in.flow_rate_lpm,
            status="ACTIVE",
            created_at=now,
            updated_at=now,
        )
        db.add(tank)
        db.commit()
        db.refresh(tank)

    # Log telemetry
    telemetry_log = models.TelemetryLog(
        sensor_id=telemetry_in.sensor_id,
        tank_id=tank.id,
        timestamp=telemetry_in.timestamp or now,
        water_level_liters=telemetry_in.water_level_liters,
        flow_rate_lpm=telemetry_in.flow_rate_lpm,
        ph_level=telemetry_in.ph_level,
        turbidity_ntu=telemetry_in.turbidity_ntu,
        tds_ppm=telemetry_in.tds_ppm,
        precipitation_mm=telemetry_in.precipitation_mm,
        head_pressure_psi=telemetry_in.head_pressure_psi,
        water_temp_c=telemetry_in.water_temp_c,
        created_at=now,
    )
    db.add(telemetry_log)

    # Update tank current volume and flow rate
    tank.current_volume_liters = telemetry_in.water_level_liters
    tank.net_inflow_rate_lpm = telemetry_in.flow_rate_lpm
    fill_pct = (
        (tank.current_volume_liters / tank.total_capacity_liters) * 100.0
        if tank.total_capacity_liters > 0
        else 0.0
    )

    # 1. Evaluate capacity thresholds
    if fill_pct >= 98.0:
        tank.overflow_valve_open = True
        tank.status = "OVERFLOW"
        alert = models.Alert(
            tank_id=tank.id,
            severity="HIGH",
            category="OVERFLOW",
            message=f"Tank '{tank.name}' reached {fill_pct:.1f}% capacity. Overflow valves opened automatically.",
            is_acknowledged=False,
            created_at=now,
        )
        db.add(alert)
    elif fill_pct < 10.0:
        tank.supply_pump_active = False
        tank.municipal_backup_active = True
        tank.status = "WARNING"
        alert = models.Alert(
            tank_id=tank.id,
            severity="WARNING",
            category="PUMP",
            message=f"Tank '{tank.name}' capacity low ({fill_pct:.1f}%). Supply pump halted and municipal backup engaged.",
            is_acknowledged=False,
            created_at=now,
        )
        db.add(alert)
    else:
        if fill_pct >= 30.0:
            tank.supply_pump_active = True
        tank.overflow_valve_open = False
        tank.municipal_backup_active = False
        if tank.status in ["OVERFLOW", "WARNING"]:
            tank.status = "ACTIVE"

    # 2. Evaluate water quality parameters (pH 6.5–8.5, turbidity <= 2.0 NTU)
    ph = telemetry_in.ph_level if telemetry_in.ph_level is not None else 7.2
    turb = telemetry_in.turbidity_ntu if telemetry_in.turbidity_ntu is not None else 1.0
    tds = telemetry_in.tds_ppm if telemetry_in.tds_ppm is not None else 120.0

    is_ph_valid = 6.5 <= ph <= 8.5
    is_turbidity_valid = turb <= 2.0
    quality_passed = is_ph_valid and is_turbidity_valid

    quality_metric = models.QualityMetric(
        tank_id=tank.id,
        ph_level=ph,
        turbidity_ntu=turb,
        tds_ppm=tds,
        pass_status=quality_passed,
        backwash_scheduled=not quality_passed,
        timestamp=now,
        created_at=now,
    )
    db.add(quality_metric)

    if not quality_passed:
        tank.clean_valve_open = False
        reasons = []
        if not is_ph_valid:
            reasons.append(f"pH {ph:.2f} outside 6.5–8.5 range")
        if not is_turbidity_valid:
            reasons.append(f"Turbidity {turb:.2f} NTU exceeds 2.0 NTU threshold")

        alert = models.Alert(
            tank_id=tank.id,
            severity="HIGH",
            category="QUALITY",
            message=f"Water quality failed for Tank '{tank.name}': {', '.join(reasons)}. Output valve closed; backwash cycle scheduled.",
            is_acknowledged=False,
            created_at=now,
        )
        db.add(alert)
    else:
        tank.clean_valve_open = True

    # 3. Evaluate Yield if rainfall recorded
    if telemetry_in.precipitation_mm and telemetry_in.precipitation_mm > 0:
        area = telemetry_in.catchment_area_sqm or 500.0
        eff = 0.9
        harvested = area * telemetry_in.precipitation_mm * eff
        yield_analytic = models.YieldAnalytic(
            tank_id=tank.id,
            catchment_area_sqm=area,
            precipitation_mm=telemetry_in.precipitation_mm,
            efficiency_factor=eff,
            harvested_liters=harvested,
            recorded_date=now,
            created_at=now,
        )
        db.add(yield_analytic)

    # 4. Check pump operating hours
    if tank.pump_operating_hours >= 500.0:
        existing_maint_alert = (
            db.query(models.Alert)
            .filter(
                models.Alert.tank_id == tank.id,
                models.Alert.category == "MAINTENANCE",
                models.Alert.is_acknowledged.is_(False),
            )
            .first()
        )
        if not existing_maint_alert:
            alert = models.Alert(
                tank_id=tank.id,
                severity="MEDIUM",
                category="MAINTENANCE",
                message=f"Pump on Tank '{tank.name}' reached {tank.pump_operating_hours:.0f} operating hours. Scheduled maintenance required.",
                is_acknowledged=False,
                created_at=now,
            )
            db.add(alert)

    tank.updated_at = now
    db.commit()
    db.refresh(telemetry_log)
    db.refresh(tank)

    return telemetry_log, tank


def trigger_backwash(
    db: Session, request: schemas.BackwashRequest
) -> models.BackwashLog:
    now = datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None)
    tank = get_tank_by_id(db, request.tank_id)

    backwash = models.BackwashLog(
        tank_id=request.tank_id,
        unit_name=request.unit_name or "Filtration Unit 1",
        status="COMPLETED",
        triggered_by=request.triggered_by or "MANUAL",
        timestamp=now,
        notes=request.notes or "Backwash cycle completed successfully.",
    )
    db.add(backwash)

    # Reset backwash_scheduled on latest quality metric for this tank
    latest_qm = (
        db.query(models.QualityMetric)
        .filter(models.QualityMetric.tank_id == request.tank_id)
        .order_by(models.QualityMetric.timestamp.desc())
        .first()
    )
    if latest_qm:
        latest_qm.backwash_scheduled = False

    if tank:
        tank.clean_valve_open = True
        tank.updated_at = now

    db.commit()
    db.refresh(backwash)
    return backwash


def calculate_yield(
    catchment_area_sqm: float, precipitation_mm: float, efficiency_factor: float = 0.9
) -> float:
    return catchment_area_sqm * precipitation_mm * efficiency_factor
