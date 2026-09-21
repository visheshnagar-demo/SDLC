import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from server.database import get_db
from server.models.movement import InmateMovement
from server.models.inmate import Inmate
from server.models.housing import HousingUnit, CellAssignment
from server.models.audit import User
from server.schemas.movement import (
    MovementCreate,
    MovementResponse,
    HeadcountResponse,
    HeadcountUnitSummary,
)
from server.middleware.auth import get_current_user
from server.middleware.audit import log_audit_event

router = APIRouter(prefix="/movements", tags=["Movements"])


@router.post("", response_model=MovementResponse, status_code=status.HTTP_201_CREATED)
def dispatch_movement(
    movement_in: MovementCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    inmate = db.query(Inmate).filter(Inmate.id == movement_in.inmate_id).first()
    if not inmate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Inmate with ID '{movement_in.inmate_id}' not found.",
        )

    now = datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None)
    duration = datetime.timedelta(minutes=movement_in.expected_duration_minutes)
    expected_arrival = now + duration

    movement = InmateMovement(
        inmate_id=inmate.id,
        source_location=movement_in.source_location,
        destination_location=movement_in.destination_location,
        purpose=movement_in.purpose,
        escort_officer=movement_in.escort_officer,
        departure_time=now,
        expected_arrival_time=expected_arrival,
        status="IN_TRANSIT",
        is_overdue=False,
    )
    db.add(movement)

    inmate.status = "IN_TRANSIT"

    db.commit()
    db.refresh(movement)

    log_audit_event(
        db=db,
        action="MOVEMENT_DISPATCHED",
        resource=f"/api/v1/movements/{movement.id}",
        user_id=current_user.id,
        user_role=current_user.role,
        details=f"Inmate {inmate.id} movement dispatched from {movement.source_location} to {movement.destination_location}",
    )

    return movement


@router.put("/{movement_id}/complete", response_model=MovementResponse)
def complete_movement(
    movement_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    movement = db.query(InmateMovement).filter(InmateMovement.id == movement_id).first()
    if not movement:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Movement record with ID '{movement_id}' not found.",
        )

    now = datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None)
    movement.status = "COMPLETED"
    movement.arrival_time = now

    inmate = db.query(Inmate).filter(Inmate.id == movement.inmate_id).first()
    if inmate:
        inmate.status = "HOUSED"

    db.commit()
    db.refresh(movement)

    log_audit_event(
        db=db,
        action="MOVEMENT_COMPLETED",
        resource=f"/api/v1/movements/{movement.id}",
        user_id=current_user.id,
        user_role=current_user.role,
        details=f"Inmate movement {movement.id} completed. Arrival confirmed.",
    )

    return movement


@router.get("/active", response_model=List[MovementResponse])
def list_active_movements(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    now = datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None)
    movements = (
        db.query(InmateMovement).filter(InmateMovement.status == "IN_TRANSIT").all()
    )

    updated_any = False
    for m in movements:
        if m.expected_arrival_time and now > m.expected_arrival_time:
            if not m.is_overdue:
                m.is_overdue = True
                updated_any = True

    if updated_any:
        db.commit()

    return movements


@router.get("/headcount", response_model=HeadcountResponse)
def get_facility_headcount(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    units = db.query(HousingUnit).all()

    total_capacity = sum(u.capacity for u in units) if units else 0
    total_active = (
        db.query(Inmate)
        .filter(Inmate.status != "DISCHARGED", Inmate.status != "released")
        .count()
    )
    total_in_transit = db.query(Inmate).filter(Inmate.status == "IN_TRANSIT").count()

    unit_summaries = []
    for u in units:
        assigned_count = (
            db.query(CellAssignment)
            .join(Inmate, CellAssignment.inmate_id == Inmate.id)
            .filter(
                CellAssignment.unit_id == u.id,
                CellAssignment.is_active == True,
                Inmate.status != "DISCHARGED",
            )
            .count()
        )
        in_transit_unit = (
            db.query(CellAssignment)
            .join(Inmate, CellAssignment.inmate_id == Inmate.id)
            .filter(
                CellAssignment.unit_id == u.id,
                CellAssignment.is_active == True,
                Inmate.status == "IN_TRANSIT",
            )
            .count()
        )
        unit_summaries.append(
            HeadcountUnitSummary(
                unit_id=u.id,
                unit_name=u.unit_name,
                capacity=u.capacity,
                assigned_count=assigned_count,
                in_transit_count=in_transit_unit,
                physical_count=max(0, assigned_count - in_transit_unit),
            )
        )

    return HeadcountResponse(
        total_facility_capacity=total_capacity,
        total_active_inmates=total_active,
        total_in_transit=total_in_transit,
        units=unit_summaries,
    )
