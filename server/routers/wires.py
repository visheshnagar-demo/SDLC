from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy.orm import Session

from server.database import get_db
from server.models import WireTransfer
from server.schemas import WireCreate

router = APIRouter(prefix="/wires", tags=["Wires"])


def format_wire_response(wire: WireTransfer) -> dict:
    created_at_str = wire.created_at.isoformat() if wire.created_at else None
    updated_at_str = wire.updated_at.isoformat() if wire.updated_at else None
    return {
        "id": wire.id,
        "beneficiaryName": wire.beneficiary_name,
        "accountNumber": wire.account_number,
        "routingNumber": wire.routing_number,
        "amount": wire.amount,
        "status": wire.status,
        "createdBy": wire.created_by,
        "approvedBy": wire.approved_by,
        "created_at": created_at_str,
        "updated_at": updated_at_str,
        "beneficiary_name": wire.beneficiary_name,
        "account_number": wire.account_number,
        "routing_number": wire.routing_number,
        "created_by": wire.created_by,
        "approved_by": wire.approved_by,
    }


@router.post("", status_code=status.HTTP_201_CREATED)
@router.post("/", status_code=status.HTTP_201_CREATED)
def create_wire_transfer(
    wire_in: WireCreate,
    x_user_id: Optional[str] = Header(None, alias="X-User-Id"),
    db: Session = Depends(get_db),
):
    current_user = x_user_id.strip() if x_user_id and x_user_id.strip() else "User A"

    # Dual control threshold: > $10,000 requires PENDING status for Checker approval
    if wire_in.amount > 10000.0:
        wire_status = "PENDING"
        approved_by = None
    else:
        wire_status = "APPROVED"
        approved_by = "System"

    wire = WireTransfer(
        beneficiary_name=wire_in.beneficiaryName,
        account_number=wire_in.accountNumber,
        routing_number=wire_in.routingNumber,
        amount=wire_in.amount,
        status=wire_status,
        created_by=current_user,
        approved_by=approved_by,
    )

    db.add(wire)
    db.commit()
    db.refresh(wire)

    return format_wire_response(wire)


@router.get("/pending")
def get_pending_wires(db: Session = Depends(get_db)):
    wires = (
        db.query(WireTransfer)
        .filter(WireTransfer.status == "PENDING")
        .order_by(WireTransfer.created_at.desc())
        .all()
    )
    return [format_wire_response(w) for w in wires]


@router.get("/metrics")
def get_wire_metrics(db: Session = Depends(get_db)):
    all_wires = db.query(WireTransfer).all()
    total_volume = sum(w.amount for w in all_wires if w.status == "APPROVED")
    pending_count = sum(1 for w in all_wires if w.status == "PENDING")
    auto_approved = sum(
        1 for w in all_wires if w.status == "APPROVED" and w.approved_by == "System"
    )
    approved_count = sum(1 for w in all_wires if w.status == "APPROVED")
    rejected_count = sum(1 for w in all_wires if w.status == "REJECTED")

    return {
        "totalVolume": round(total_volume, 2),
        "pendingCount": pending_count,
        "autoApprovedCount": auto_approved,
        "approvedCount": approved_count,
        "rejectedCount": rejected_count,
    }


@router.get("")
@router.get("/")
def list_wires(
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = db.query(WireTransfer)
    if status_filter:
        query = query.filter(WireTransfer.status == status_filter.upper())
    wires = query.order_by(WireTransfer.created_at.desc()).all()
    return [format_wire_response(w) for w in wires]


@router.get("/{wire_id}")
def get_wire_by_id(wire_id: str, db: Session = Depends(get_db)):
    wire = db.query(WireTransfer).filter(WireTransfer.id == wire_id).first()
    if not wire:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Wire transfer with ID '{wire_id}' not found",
        )
    return format_wire_response(wire)


@router.put("/{wire_id}/approve")
def approve_wire_transfer(
    wire_id: str,
    x_user_id: Optional[str] = Header(None, alias="X-User-Id"),
    db: Session = Depends(get_db),
):
    current_user = x_user_id.strip() if x_user_id and x_user_id.strip() else "User B"

    wire = db.query(WireTransfer).filter(WireTransfer.id == wire_id).first()
    if not wire:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Wire transfer with ID '{wire_id}' not found",
        )

    # Dual Control Rule: Maker cannot approve their own wire transfer
    if current_user.lower() == wire.created_by.strip().lower():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Maker cannot approve their own wire transfer",
        )

    if wire.status != "PENDING":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Wire transfer is already in '{wire.status}' status and cannot be approved",
        )

    wire.status = "APPROVED"
    wire.approved_by = current_user
    wire.updated_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(wire)

    return format_wire_response(wire)


@router.put("/{wire_id}/reject")
def reject_wire_transfer(
    wire_id: str,
    x_user_id: Optional[str] = Header(None, alias="X-User-Id"),
    db: Session = Depends(get_db),
):
    current_user = x_user_id.strip() if x_user_id and x_user_id.strip() else "User B"

    wire = db.query(WireTransfer).filter(WireTransfer.id == wire_id).first()
    if not wire:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Wire transfer with ID '{wire_id}' not found",
        )

    if wire.status != "PENDING":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Wire transfer is already in '{wire.status}' status and cannot be rejected",
        )

    wire.status = "REJECTED"
    wire.approved_by = current_user
    wire.updated_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(wire)

    return format_wire_response(wire)
