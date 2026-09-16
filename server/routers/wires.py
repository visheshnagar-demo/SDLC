from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from server.database import get_db
from server.models.wire import WireTransfer
from server.schemas.wire import WireCreate, WireApprove, WireReject, WireResponse

router = APIRouter(prefix="/api/wires", tags=["Wire Transfers"])

AUTO_APPROVAL_THRESHOLD = 10000.00


@router.post("", response_model=WireResponse, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=WireResponse, status_code=status.HTTP_201_CREATED)
def create_wire(wire_in: WireCreate, db: Session = Depends(get_db)):
    """
    Initiate a new wire transfer.
    - If amount > $10,000.00: Status set to PENDING (requires Checker approval).
    - If amount <= $10,000.00: Status automatically set to APPROVED.
    """
    initial_status = (
        "PENDING" if wire_in.amount > AUTO_APPROVAL_THRESHOLD else "APPROVED"
    )

    db_wire = WireTransfer(
        beneficiaryName=wire_in.beneficiaryName,
        accountNumber=wire_in.accountNumber,
        routingNumber=wire_in.routingNumber,
        amount=wire_in.amount,
        status=initial_status,
        createdBy=wire_in.createdBy,
        approvedBy=None,
    )
    db.add(db_wire)
    db.commit()
    db.refresh(db_wire)
    return db_wire


@router.get("/pending", response_model=List[WireResponse])
def get_pending_wires(db: Session = Depends(get_db)):
    """
    Retrieve all wire transfers with PENDING status.
    """
    pending_wires = (
        db.query(WireTransfer)
        .filter(WireTransfer.status == "PENDING")
        .order_by(WireTransfer.created_at.desc())
        .all()
    )
    return pending_wires


@router.put("/{wire_id}/approve", response_model=WireResponse)
def approve_wire(wire_id: str, wire_in: WireApprove, db: Session = Depends(get_db)):
    """
    Approve a pending wire transfer.
    Enforces Segregation of Duties: approvedBy must NOT equal createdBy (returns 403 Forbidden).
    """
    wire = db.query(WireTransfer).filter(WireTransfer.id == wire_id).first()
    if not wire:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Wire transfer not found"
        )

    if wire.status != "PENDING":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Wire transfer is in '{wire.status}' status and cannot be approved.",
        )

    # Segregation of Duties check
    if wire.createdBy == wire_in.approvedBy:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Action Denied: Maker cannot approve their own wire transfer.",
        )

    wire.status = "APPROVED"
    wire.approvedBy = wire_in.approvedBy
    wire.updated_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(wire)
    return wire


@router.put("/{wire_id}/reject", response_model=WireResponse)
def reject_wire(wire_id: str, wire_in: WireReject, db: Session = Depends(get_db)):
    """
    Reject a pending wire transfer.
    """
    wire = db.query(WireTransfer).filter(WireTransfer.id == wire_id).first()
    if not wire:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Wire transfer not found"
        )

    if wire.status != "PENDING":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Wire transfer is in '{wire.status}' status and cannot be rejected.",
        )

    wire.status = "REJECTED"
    wire.approvedBy = wire_in.approvedBy
    wire.updated_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(wire)
    return wire
