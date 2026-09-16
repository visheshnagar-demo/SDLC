from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from server.database import get_db
from server.models import WireTransfer
from server.schemas import (
    WireCreate,
    WireApproveRequest,
    WireRejectRequest,
    WireResponse,
)

router = APIRouter()


@router.post("", response_model=WireResponse, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=WireResponse, status_code=status.HTTP_201_CREATED)
def create_wire(payload: WireCreate, db: Session = Depends(get_db)):
    """
    Creates a new wire transfer.
    If amount <= $10,000, status is set to 'APPROVED' automatically.
    If amount > $10,000, status is set to 'PENDING' requiring Checker review.
    """
    wire_status = "APPROVED" if payload.amount <= 10000 else "PENDING"

    wire = WireTransfer(
        beneficiary_name=payload.beneficiaryName,
        account_number=payload.accountNumber,
        routing_number=payload.routingNumber,
        amount=payload.amount,
        status=wire_status,
        created_by=payload.createdBy,
        approved_by="SYSTEM" if wire_status == "APPROVED" else None,
    )
    db.add(wire)
    db.commit()
    db.refresh(wire)
    return WireResponse.model_validate(wire)


@router.get("/pending", response_model=List[WireResponse])
def get_pending_wires(db: Session = Depends(get_db)):
    """
    Returns all wire transfers with status 'PENDING'.
    """
    wires = (
        db.query(WireTransfer)
        .filter(WireTransfer.status == "PENDING")
        .order_by(WireTransfer.created_at.desc())
        .all()
    )
    return [WireResponse.model_validate(w) for w in wires]


@router.get("", response_model=List[WireResponse])
@router.get("/", response_model=List[WireResponse])
def get_all_wires(db: Session = Depends(get_db)):
    """
    Returns all wire transfers regardless of status.
    """
    wires = db.query(WireTransfer).order_by(WireTransfer.created_at.desc()).all()
    return [WireResponse.model_validate(w) for w in wires]


@router.get("/{wire_id}", response_model=WireResponse)
def get_wire_by_id(wire_id: str, db: Session = Depends(get_db)):
    """
    Fetches a specific wire transfer by ID.
    """
    wire = db.query(WireTransfer).filter(WireTransfer.id == wire_id).first()
    if not wire:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Wire transfer not found"
        )
    return WireResponse.model_validate(wire)


@router.put("/{wire_id}/approve", response_model=WireResponse)
def approve_wire(
    wire_id: str, payload: WireApproveRequest, db: Session = Depends(get_db)
):
    """
    Approves a pending wire transfer.
    Enforces Maker-Checker segregation: approvedBy MUST NOT equal createdBy.
    Returns HTTP 403 Forbidden if the creator attempts self-approval.
    """
    wire = db.query(WireTransfer).filter(WireTransfer.id == wire_id).first()
    if not wire:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Wire transfer not found"
        )

    # Segregation of duties check: Maker cannot approve their own wire transfer
    if wire.created_by == payload.approvedBy:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Action Denied: Maker cannot approve their own wire transfer.",
        )

    wire.status = "APPROVED"
    wire.approved_by = payload.approvedBy
    wire.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(wire)
    return WireResponse.model_validate(wire)


@router.put("/{wire_id}/reject", response_model=WireResponse)
def reject_wire(
    wire_id: str, payload: WireRejectRequest, db: Session = Depends(get_db)
):
    """
    Rejects a pending wire transfer.
    """
    wire = db.query(WireTransfer).filter(WireTransfer.id == wire_id).first()
    if not wire:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Wire transfer not found"
        )

    wire.status = "REJECTED"
    wire.approved_by = payload.approvedBy
    wire.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(wire)
    return WireResponse.model_validate(wire)
