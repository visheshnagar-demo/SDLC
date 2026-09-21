from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

from server.database import get_db
from server.models.housing import HousingUnit, CellAssignment, KeepAwayRule
from server.models.inmate import Inmate
from server.models.audit import User
from server.schemas.housing import (
    HousingUnitResponse,
    HousingAssignRequest,
    HousingAssignResponse,
    KeepAwayRuleCreate,
    KeepAwayRuleResponse,
)
from server.middleware.auth import get_current_user
from server.middleware.audit import log_audit_event

router = APIRouter(prefix="/housing", tags=["Housing"])


@router.get("/units", response_model=List[HousingUnitResponse])
def list_housing_units(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    units = db.query(HousingUnit).all()
    if not units:
        default_units = [
            HousingUnit(
                unit_name="Unit A - Minimum Security",
                security_level="MINIMUM",
                capacity=40,
                current_occupancy=0,
            ),
            HousingUnit(
                unit_name="Unit B - Medium Security",
                security_level="MEDIUM",
                capacity=50,
                current_occupancy=0,
            ),
            HousingUnit(
                unit_name="Unit C - Maximum Security",
                security_level="MAXIMUM",
                capacity=30,
                current_occupancy=0,
            ),
            HousingUnit(
                unit_name="Unit D - Medical Isolation",
                security_level="MAXIMUM",
                capacity=15,
                current_occupancy=0,
            ),
        ]
        for u in default_units:
            db.add(u)
        db.commit()
        units = db.query(HousingUnit).all()
    return units


@router.post("/assign", response_model=HousingAssignResponse)
def assign_housing_cell(
    request: HousingAssignRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    inmate = db.query(Inmate).filter(Inmate.id == request.inmate_id).first()
    if not inmate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Inmate with ID '{request.inmate_id}' not found.",
        )

    unit = db.query(HousingUnit).filter(HousingUnit.id == request.unit_id).first()
    if not unit:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Housing unit with ID '{request.unit_id}' not found.",
        )

    conflicting_assignments = (
        db.query(CellAssignment)
        .filter(CellAssignment.unit_id == unit.id, CellAssignment.is_active == True)
        .all()
    )
    housed_inmate_ids = [
        a.inmate_id for a in conflicting_assignments if a.inmate_id != inmate.id
    ]

    has_keep_away_conflict = False
    conflict_details = []

    if housed_inmate_ids:
        keep_aways = (
            db.query(KeepAwayRule)
            .filter(
                or_(
                    (KeepAwayRule.inmate_id == inmate.id)
                    & (KeepAwayRule.keep_away_inmate_id.in_(housed_inmate_ids)),
                    (KeepAwayRule.keep_away_inmate_id == inmate.id)
                    & (KeepAwayRule.inmate_id.in_(housed_inmate_ids)),
                )
            )
            .all()
        )
        if keep_aways:
            has_keep_away_conflict = True
            conflict_details.append(
                f"Keep-away rule conflict with inmates in unit '{unit.unit_name}'"
            )

    if has_keep_away_conflict and not request.supervisor_override:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Housing assignment blocked due to keep-away conflict: {'; '.join(conflict_details)}. Supervisor override required.",
        )

    db.query(CellAssignment).filter(
        CellAssignment.inmate_id == inmate.id, CellAssignment.is_active == True
    ).update({"is_active": False})

    new_assignment = CellAssignment(
        inmate_id=inmate.id,
        unit_id=unit.id,
        cell_number=request.cell_number,
        is_active=True,
        override_reason=request.override_reason
        if request.supervisor_override
        else None,
    )
    db.add(new_assignment)

    inmate.status = "HOUSED"
    unit.current_occupancy = (
        db.query(CellAssignment)
        .filter(CellAssignment.unit_id == unit.id, CellAssignment.is_active == True)
        .count()
        + 1
    )

    db.commit()
    db.refresh(new_assignment)

    log_audit_event(
        db=db,
        action="HOUSING_ASSIGNED",
        resource="/api/v1/housing/assign",
        user_id=current_user.id,
        user_role=current_user.role,
        details=f"Assigned inmate {inmate.id} to Unit '{unit.unit_name}' Cell '{request.cell_number}'. Override: {request.supervisor_override}",
    )

    return HousingAssignResponse(
        assignment_id=new_assignment.id,
        inmate_id=inmate.id,
        unit_id=unit.id,
        unit_name=unit.unit_name,
        cell_number=new_assignment.cell_number,
        assigned_at=new_assignment.assigned_at,
        is_override=request.supervisor_override,
        status="ASSIGNED",
    )


@router.post(
    "/keep-away",
    response_model=KeepAwayRuleResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_keep_away_rule(
    rule_in: KeepAwayRuleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    inmate1 = db.query(Inmate).filter(Inmate.id == rule_in.inmate_id).first()
    inmate2 = db.query(Inmate).filter(Inmate.id == rule_in.keep_away_inmate_id).first()

    if not inmate1 or not inmate2:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="One or both inmates specified for keep-away rule were not found.",
        )

    rule = KeepAwayRule(
        inmate_id=rule_in.inmate_id,
        keep_away_inmate_id=rule_in.keep_away_inmate_id,
        reason=rule_in.reason,
    )
    db.add(rule)
    db.commit()
    db.refresh(rule)

    log_audit_event(
        db=db,
        action="KEEP_AWAY_RULE_CREATED",
        resource="/api/v1/housing/keep-away",
        user_id=current_user.id,
        user_role=current_user.role,
        details=f"Keep-away rule created between {inmate1.id} and {inmate2.id}: {rule_in.reason}",
    )

    return rule
