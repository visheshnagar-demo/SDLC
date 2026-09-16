from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Header, status
from sqlalchemy.orm import Session

from server.database import get_db
from server.models import WireTransfer
from server.schemas import WireCreate, WireResponse

router = APIRouter(prefix="/api/wires", tags=["Wire Transfers"])


def utc_now():
    return datetime.now(timezone.utc)


def get_active_user(x_user_id: Optional[str] = Header(None, alias="X-User-Id"), default: str = "User A") -> str:
    if x_user_id and x_user_id.strip():
        return x_user_id.strip()
    return default


@router.post("", response_model=WireResponse, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=WireResponse, status_code=status.HTTP_201_CREATED)
def create_wire(
    wire_in: WireCreate,
    x_user_id: Optional[str] = Header(None, alias="X-User-Id"),
    db: Session = Depends(get_db),
):
    maker_id = get_active_user(x_user_id, default="User A")

    # Threshold evaluation: amount > $10,000 -> PENDING, else APPROVED
    if wire_in.amount > 10000.00:
        wire_status = "PENDING"
    else:
        wire_status = "APPROVED"

    wire = WireTransfer(
        beneficiary_name=wire_in.beneficiary_name,
        account_number=wire_in.account_number,
        routing_number=wire_in.routing_number,
        amount=wire_in.amount,
        status=wire_status,
        created_by=maker_id,
        approved_by=None if wire_status == "PENDING" else "SYSTEM",
    )
    db.add(wire)
    db.commit()
    db.refresh(wire)
    return wire


@router.get("/pending", response_model=List[WireResponse])
def get_pending_wires(db: Session = Depends(get_db)):
    wires = db.query(WireTransfer).filter(WireTransfer.status == "PENDING").all()
    return wires


@router.get("", response_model=List[WireResponse])
@router.get("/", response_model=List[WireResponse])
def get_all_wires(db: Session = Depends(get_db)):
    wires = db.query(WireTransfer).order_by(WireTransfer.created_at.desc()).all()
    return wires


@router.get("/{id}", response_model=WireResponse)
def get_wire_by_id(id: str, db: Session = Depends(get_db)):
    wire = db.query(WireTransfer).filter(WireTransfer.id == id).first()
    if not wire:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Wire transfer not found",
        )
    return wire


@router.put("/{id}/approve", response_model=WireResponse)
def approve_wire(
    id: str,
    x_user_id: Optional[str] = Header(None, alias="X-User-Id"),
    db: Session = Depends(get_db),
):
    checker_id = get_active_user(x_user_id, default="User B")
    wire = db.query(WireTransfer).filter(WireTransfer.id == id).first()
    if not wire:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Wire transfer not found",
        )

    if wire.status != "PENDING":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PENDING wire transfers can be approved",
        )

    # Segregation of duties check: Maker cannot approve their own wire
    if wire.created_by == checker_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Maker cannot approve their own wire transfer",
        )

    wire.status = "APPROVED"
    wire.approved_by = checker_id
    wire.updated_at = utc_now()
    db.commit()
    db.refresh(wire)
    return wire


@router.put("/{id}/reject", response_model=WireResponse)
def reject_wire(
    id: str,
    x_user_id: Optional[str] = Header(None, alias="X-User-Id"),
    db: Session = Depends(get_db),
):
    checker_id = get_active_user(x_user_id, default="User B")
    wire = db.query(WireTransfer).filter(WireTransfer.id == id).first()
    if not wire:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Wire transfer not found",
        )

    if wire.status != "PENDING":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PENDING wire transfers can be rejected",
        )

    wire.status = "REJECTED"
    wire.approved_by = checker_id
    wire.updated_at = utc_now()
    db.commit()
    db.refresh(wire)
    return wire
