import json
import uuid
import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from server.database import get_db
from server.models import Inmate, Cell, AuditLog, User
from server.schemas import (
    CellCreate,
    CellUpdate,
    CellResponse,
    CellAssignmentRequest,
    CellAssignmentResponse,
)
from server.routers.auth import get_current_user, RequireRole

router = APIRouter(prefix="/api/v1/cells", tags=["cells"])

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


@router.get("", response_model=List[CellResponse])
@router.get("/", response_model=List[CellResponse])
def list_cells(
    block_name: Optional[str] = None,
    security_tier: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Cell)
    if block_name:
        query = query.filter(Cell.block_name == block_name)
    if security_tier:
        query = query.filter(Cell.security_tier == security_tier.upper())
    return query.all()


@router.post("", response_model=CellResponse, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=CellResponse, status_code=status.HTTP_201_CREATED)
def create_cell(
    cell_in: CellCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    existing = db.query(Cell).filter(Cell.cell_number == cell_in.cell_number).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cell with number '{cell_in.cell_number}' already exists.",
        )

    cell = Cell(
        id=str(uuid.uuid4()),
        cell_number=cell_in.cell_number,
        block_name=cell_in.block_name,
        capacity=cell_in.capacity,
        current_occupancy=0,
        security_tier=cell_in.security_tier.upper(),
        is_active=True,
    )
    db.add(cell)
    db.commit()
    db.refresh(cell)

    log_audit(
        db,
        current_user,
        action="CREATE_CELL",
        resource_type="CELL",
        resource_id=cell.id,
        before={},
        after={"cell_number": cell.cell_number, "capacity": cell.capacity},
    )
    db.commit()

    return cell


@router.post("/assign", response_model=CellAssignmentResponse)
def assign_inmate_to_cell(
    req: CellAssignmentRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    inmate = db.query(Inmate).filter(Inmate.id == req.inmate_id).first()
    if not inmate:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Inmate not found.")

    target_cell = db.query(Cell).filter(Cell.id == req.cell_id).first()
    if not target_cell:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Target cell not found.")

    # Check capacity
    if target_cell.current_occupancy >= target_cell.capacity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cell {target_cell.cell_number} has reached its capacity limit of {target_cell.capacity}.",
        )

    # Check security tier mismatch
    inmate_tier_rank = TIER_RANKS.get(inmate.security_tier.upper(), 2)
    cell_tier_rank = TIER_RANKS.get(target_cell.security_tier.upper(), 2)

    if inmate_tier_rank > cell_tier_rank:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Security tier mismatch: High-security inmate ({inmate.security_tier}) cannot be assigned to {target_cell.security_tier} Cell {target_cell.cell_number}.",
        )

    previous_cell_id = inmate.cell_id
    if previous_cell_id and previous_cell_id != target_cell.id:
        prev_cell = db.query(Cell).filter(Cell.id == previous_cell_id).first()
        if prev_cell and prev_cell.current_occupancy > 0:
            prev_cell.current_occupancy -= 1

    if inmate.cell_id != target_cell.id:
        inmate.cell_id = target_cell.id
        target_cell.current_occupancy += 1

    db.commit()

    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
    log_audit(
        db,
        current_user,
        action="CELL_ASSIGNMENT",
        resource_type="CELL",
        resource_id=target_cell.id,
        before={"previous_cell_id": previous_cell_id},
        after={"new_cell_id": target_cell.id, "inmate_id": inmate.id},
    )
    db.commit()

    return CellAssignmentResponse(
        status="SUCCESS",
        message=f"Inmate {inmate.inmate_number} assigned to Cell {target_cell.cell_number} ({target_cell.block_name})",
        assigned_at=now_iso,
        inmate_id=inmate.id,
        cell_id=target_cell.id,
    )
