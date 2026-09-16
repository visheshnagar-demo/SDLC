from datetime import datetime
from typing import List
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from server.models import WireTransfer
from server.schemas import WireTransferCreate

AUTO_APPROVAL_THRESHOLD = 10000.00


def create_wire(db: Session, wire_in: WireTransferCreate, created_by: str) -> WireTransfer:
    if wire_in.amount > AUTO_APPROVAL_THRESHOLD:
        wire_status = "PENDING"
        approved_by = None
    else:
        wire_status = "APPROVED"
        approved_by = "SYSTEM_AUTO"

    wire = WireTransfer(
        beneficiary_name=wire_in.beneficiaryName,
        account_number=wire_in.accountNumber,
        routing_number=wire_in.routingNumber,
        amount=wire_in.amount,
        status=wire_status,
        created_by=created_by,
        approved_by=approved_by,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    db.add(wire)
    db.commit()
    db.refresh(wire)
    return wire


def get_pending_wires(db: Session) -> List[WireTransfer]:
    return (
        db.query(WireTransfer)
        .filter(WireTransfer.status == "PENDING")
        .order_by(WireTransfer.created_at.desc())
        .all()
    )


def approve_wire(db: Session, wire_id: str, approved_by: str) -> WireTransfer:
    wire = db.query(WireTransfer).filter(WireTransfer.id == wire_id).first()
    if not wire:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Wire transfer not found"
        )

    if wire.status != "PENDING":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Wire transfer cannot be approved because current status is '{wire.status}'",
        )

    # Segregation of duties check: Maker cannot approve own wire
    if approved_by == wire.created_by:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Maker cannot approve their own wire transfer. Dual control rule violated.",
        )

    wire.status = "APPROVED"
    wire.approved_by = approved_by
    wire.updated_at = datetime.utcnow()

    db.add(wire)
    db.commit()
    db.refresh(wire)
    return wire


def reject_wire(db: Session, wire_id: str, rejected_by: str) -> WireTransfer:
    wire = db.query(WireTransfer).filter(WireTransfer.id == wire_id).first()
    if not wire:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Wire transfer not found"
        )

    if wire.status != "PENDING":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Wire transfer cannot be rejected because current status is '{wire.status}'",
        )

    wire.status = "REJECTED"
    wire.approved_by = rejected_by
    wire.updated_at = datetime.utcnow()

    db.add(wire)
    db.commit()
    db.refresh(wire)
    return wire
