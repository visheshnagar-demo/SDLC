import uuid
from typing import List, Optional
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from server import models, schemas
from server.database import get_db

router = APIRouter(prefix="/api/v1/equipment", tags=["Equipment"])


@router.get("", response_model=List[schemas.EquipmentResponse])
def get_equipment(
    tank_id: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    db: Session = Depends(get_db),
):
    query = db.query(models.Equipment)
    if tank_id:
        query = query.filter(models.Equipment.tank_id == tank_id)

    items = query.all()
    now = datetime.now(timezone.utc)

    # Dynamic status evaluation
    for item in items:
        # Normalize naive / aware datetime for comparison if needed
        next_due = item.next_due_at
        if next_due.tzinfo is None:
            next_due = next_due.replace(tzinfo=timezone.utc)
        
        if next_due < now and item.status != "FAILED":
            item.status = "OVERDUE"
        elif next_due <= now + timedelta(days=3) and item.status == "OPERATIONAL":
            item.status = "MAINTENANCE_DUE"

    db.commit()

    if status_filter:
        items = [i for i in items if i.status == status_filter]

    return items


@router.post("", response_model=schemas.EquipmentResponse, status_code=status.HTTP_201_CREATED)
def create_equipment(
    eq_in: schemas.EquipmentCreate,
    db: Session = Depends(get_db),
):
    tank = db.query(models.Tank).filter(models.Tank.id == eq_in.tank_id).first()
    if not tank:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Tank with id '{eq_in.tank_id}' not found",
        )

    now = datetime.now(timezone.utc)
    last_serviced_at = eq_in.last_serviced_at or now
    next_due_at = last_serviced_at + timedelta(days=eq_in.maintenance_interval_days)

    initial_status = "OPERATIONAL"
    if next_due_at < now:
        initial_status = "OVERDUE"
    elif next_due_at <= now + timedelta(days=3):
        initial_status = "MAINTENANCE_DUE"

    equipment = models.Equipment(
        id=str(uuid.uuid4()),
        tank_id=eq_in.tank_id,
        name=eq_in.name,
        equipment_type=eq_in.equipment_type,
        model_number=eq_in.model_number,
        maintenance_interval_days=eq_in.maintenance_interval_days,
        last_serviced_at=last_serviced_at,
        next_due_at=next_due_at,
        status=initial_status,
        created_at=now,
        updated_at=now,
    )
    db.add(equipment)
    db.commit()
    db.refresh(equipment)
    return equipment


@router.get("/{id}", response_model=schemas.EquipmentResponse)
def get_equipment_detail(
    id: str,
    db: Session = Depends(get_db),
):
    equipment = db.query(models.Equipment).filter(models.Equipment.id == id).first()
    if not equipment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Equipment with id '{id}' not found",
        )
    return equipment


@router.post(
    "/{id}/maintenance-logs",
    response_model=schemas.EquipmentMaintenanceLogResponse,
    status_code=status.HTTP_201_CREATED,
)
def log_maintenance(
    id: str,
    log_in: schemas.EquipmentMaintenanceLogCreate,
    db: Session = Depends(get_db),
):
    equipment = db.query(models.Equipment).filter(models.Equipment.id == id).first()
    if not equipment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Equipment with id '{id}' not found",
        )

    now = datetime.now(timezone.utc)
    service_date = log_in.service_date or now

    log = models.EquipmentMaintenanceLog(
        id=str(uuid.uuid4()),
        equipment_id=equipment.id,
        service_date=service_date,
        action_taken=log_in.action_taken,
        technician_notes=log_in.technician_notes,
        performed_by=log_in.performed_by,
        created_at=now,
    )
    db.add(log)

    # Update equipment service timestamps & status
    equipment.last_serviced_at = service_date
    equipment.next_due_at = service_date + timedelta(days=equipment.maintenance_interval_days)
    equipment.status = "OPERATIONAL"
    equipment.updated_at = now

    db.commit()
    db.refresh(log)
    return log


@router.get(
    "/{id}/maintenance-logs",
    response_model=List[schemas.EquipmentMaintenanceLogResponse],
)
def get_equipment_maintenance_logs(
    id: str,
    db: Session = Depends(get_db),
):
    equipment = db.query(models.Equipment).filter(models.Equipment.id == id).first()
    if not equipment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Equipment with id '{id}' not found",
        )

    logs = (
        db.query(models.EquipmentMaintenanceLog)
        .filter(models.EquipmentMaintenanceLog.equipment_id == id)
        .order_by(models.EquipmentMaintenanceLog.service_date.desc())
        .all()
    )
    return logs
