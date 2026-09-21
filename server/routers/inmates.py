import json
import uuid
import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

from server.database import get_db
from server.models import Inmate, Cell, AuditLog, User
from server.schemas import (
    InmateCreate,
    InmateUpdate,
    InmateResponse,
    InmateListResponse,
)
from server.routers.auth import get_current_user, RequireRole

router = APIRouter(prefix="/api/v1/inmates", tags=["inmates"])


TIER_RANKS = {
    "MINIMUM": 1,
    "MEDIUM": 2,
    "MAXIMUM": 3,
    "HIGH_SECURITY": 4,
}


def log_audit(db: Session, user: Optional[User], action: str, resource_type: str, resource_id: str, before: dict, after: dict):
    user_id = user.id if user else None
    user_role = user.role if user else "SYSTEM"
    log = AuditLog(
        id=str(uuid.uuid4()),
        user_id=user_id,
        user_role=user_role,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        payload_before=json.dumps(before),
        payload_after=json.dumps(after),
        created_at=datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None),
    )
    db.add(log)


@router.post("", response_model=InmateResponse, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=InmateResponse, status_code=status.HTTP_201_CREATED)
def create_inmate(
    inmate_in: InmateCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Check duplicate inmate number
    existing = db.query(Inmate).filter(Inmate.inmate_number == inmate_in.inmate_number).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Inmate with number '{inmate_in.inmate_number}' already exists.",
        )

    cell_obj = None
    if inmate_in.cell_id:
        cell_obj = db.query(Cell).filter(Cell.id == inmate_in.cell_id).first()
        if not cell_obj:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cell not found.")

        # Check capacity
        if cell_obj.current_occupancy >= cell_obj.capacity:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cell capacity limit reached.")

        # Check security tier compatibility
        inmate_tier_rank = TIER_RANKS.get(inmate_in.security_tier.upper(), 2)
        cell_tier_rank = TIER_RANKS.get(cell_obj.security_tier.upper(), 2)
        if inmate_tier_rank > cell_tier_rank:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Security tier mismatch: {inmate_in.security_tier} inmate cannot be assigned to {cell_obj.security_tier} Cell {cell_obj.cell_number}.",
            )

    new_id = str(uuid.uuid4())
    inmate = Inmate(
        id=new_id,
        inmate_number=inmate_in.inmate_number,
        first_name=inmate_in.first_name,
        last_name=inmate_in.last_name,
        date_of_birth=inmate_in.date_of_birth,
        security_tier=inmate_in.security_tier.upper(),
        cell_id=inmate_in.cell_id,
        medical_alerts=json.dumps(inmate_in.medical_alerts),
        offense_history=json.dumps(inmate_in.offense_history),
        emergency_contacts=json.dumps(inmate_in.emergency_contacts),
    )
    db.add(inmate)

    if cell_obj:
        cell_obj.current_occupancy += 1

    db.commit()
    db.refresh(inmate)

    log_audit(
        db,
        current_user,
        action="CREATE_INMATE",
        resource_type="INMATE",
        resource_id=inmate.id,
        before={},
        after={
            "inmate_number": inmate.inmate_number,
            "security_tier": inmate.security_tier,
            "medical_alerts": inmate_in.medical_alerts,
        },
    )
    db.commit()

    return inmate


@router.get("", response_model=List[InmateResponse])
@router.get("/", response_model=List[InmateResponse])
def list_inmates(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    security_tier: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Inmate)

    if security_tier:
        query = query.filter(Inmate.security_tier == security_tier.upper())

    if search:
        search_fmt = f"%{search}%"
        query = query.filter(
            or_(
                Inmate.inmate_number.ilike(search_fmt),
                Inmate.first_name.ilike(search_fmt),
                Inmate.last_name.ilike(search_fmt),
            )
        )

    inmates = query.offset(skip).limit(limit).all()
    return inmates


@router.get("/{id_or_number}", response_model=InmateResponse)
def get_inmate(
    id_or_number: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    inmate = (
        db.query(Inmate)
        .filter(or_(Inmate.id == id_or_number, Inmate.inmate_number == id_or_number))
        .first()
    )
    if not inmate:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Inmate record not found.")
    return inmate


@router.put("/{id}", response_model=InmateResponse)
def update_inmate(
    id: str,
    update_in: InmateUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    inmate = db.query(Inmate).filter(Inmate.id == id).first()
    if not inmate:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Inmate record not found.")

    # RBAC check: Guards cannot modify medical_alerts or offense_history
    is_guard = current_user.role.upper() == "GUARD"
    if is_guard:
        if update_in.medical_alerts is not None or update_in.offense_history is not None:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Guards are not permitted to alter medical alerts or offense histories.",
            )

    before = {
        "first_name": inmate.first_name,
        "last_name": inmate.last_name,
        "security_tier": inmate.security_tier,
        "medical_alerts": inmate.medical_alerts,
        "offense_history": inmate.offense_history,
    }

    if update_in.first_name is not None:
        inmate.first_name = update_in.first_name
    if update_in.last_name is not None:
        inmate.last_name = update_in.last_name
    if update_in.date_of_birth is not None:
        inmate.date_of_birth = update_in.date_of_birth
    if update_in.security_tier is not None:
        inmate.security_tier = update_in.security_tier.upper()
    if update_in.medical_alerts is not None:
        inmate.medical_alerts = json.dumps(update_in.medical_alerts)
    if update_in.offense_history is not None:
        inmate.offense_history = json.dumps(update_in.offense_history)
    if update_in.emergency_contacts is not None:
        inmate.emergency_contacts = json.dumps(update_in.emergency_contacts)

    db.commit()
    db.refresh(inmate)

    after = {
        "first_name": inmate.first_name,
        "last_name": inmate.last_name,
        "security_tier": inmate.security_tier,
        "medical_alerts": inmate.medical_alerts,
        "offense_history": inmate.offense_history,
    }

    log_audit(
        db,
        current_user,
        action="UPDATE_INMATE",
        resource_type="INMATE",
        resource_id=inmate.id,
        before=before,
        after=after,
    )
    db.commit()

    return inmate


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_inmate(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(RequireRole(["ADMIN"])),
):
    inmate = db.query(Inmate).filter(Inmate.id == id).first()
    if not inmate:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Inmate record not found.")

    # Decrement cell occupancy if assigned
    if inmate.cell_id:
        cell = db.query(Cell).filter(Cell.id == inmate.cell_id).first()
        if cell and cell.current_occupancy > 0:
            cell.current_occupancy -= 1

    log_audit(
        db,
        current_user,
        action="DELETE_INMATE",
        resource_type="INMATE",
        resource_id=inmate.id,
        before={"inmate_number": inmate.inmate_number},
        after={},
    )

    db.delete(inmate)
    db.commit()
    return None
