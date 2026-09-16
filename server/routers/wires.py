from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from server.database import get_db
from server.models import WireTransfer
from server.schemas import (
    WireTransferCreate,
    WireTransferAction,
    WireTransferResponse,
)

router = APIRouter(tags=["wire-transfers"])


@router.post(
    "",
    response_model=WireTransferResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Initiate Wire Transfer",
)
@router.post(
    "/",
    response_model=WireTransferResponse,
    status_code=status.HTTP_201_CREATED,
    include_in_schema=False,
)
def create_wire_transfer(
    wire_in: WireTransferCreate,
    db: Session = Depends(get_db),
):
    if wire_in.amount <= 0:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Amount must be greater than zero",
        )

    # Determine status based on $10,000 threshold
    if wire_in.amount > 10000.00:
        wire_status = "PENDING"
    else:
        wire_status = "APPROVED"

    db_wire = WireTransfer(
        beneficiary_name=wire_in.beneficiary_name,
        account_number=wire_in.account_number,
        routing_number=wire_in.routing_number,
        amount=wire_in.amount,
        status=wire_status,
        created_by=wire_in.created_by,
        approved_by=wire_in.created_by if wire_status == "APPROVED" else None,
    )
    db.add(db_wire)
    db.commit()
    db.refresh(db_wire)
    return db_wire


@router.get(
    "/pending",
    response_model=List[WireTransferResponse],
    status_code=status.HTTP_200_OK,
    summary="Get Pending Wire Transfers Queue",
)
def get_pending_wires(
    db: Session = Depends(get_db),
):
    pending_wires = (
        db.query(WireTransfer)
        .filter(WireTransfer.status == "PENDING")
        .order_by(WireTransfer.created_at.desc())
        .all()
    )
    return pending_wires


@router.put(
    "/{wire_id}/approve",
    response_model=WireTransferResponse,
    status_code=status.HTTP_200_OK,
    summary="Approve Pending Wire Transfer",
)
def approve_wire_transfer(
    wire_id: str,
    action_in: WireTransferAction,
    db: Session = Depends(get_db),
):
    db_wire = db.query(WireTransfer).filter(WireTransfer.id == wire_id).first()
    if not db_wire:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Wire transfer not found",
        )

    if db_wire.status != "PENDING":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Wire transfer is not in PENDING status",
        )

    # Segregation of duties: Maker cannot approve their own wire transfer
    if action_in.approved_by == db_wire.created_by:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Maker cannot approve their own wire transfer",
        )

    db_wire.status = "APPROVED"
    db_wire.approved_by = action_in.approved_by
    db.commit()
    db.refresh(db_wire)
    return db_wire


@router.put(
    "/{wire_id}/reject",
    response_model=WireTransferResponse,
    status_code=status.HTTP_200_OK,
    summary="Reject Pending Wire Transfer",
)
def reject_wire_transfer(
    wire_id: str,
    action_in: WireTransferAction,
    db: Session = Depends(get_db),
):
    db_wire = db.query(WireTransfer).filter(WireTransfer.id == wire_id).first()
    if not db_wire:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Wire transfer not found",
        )

    if db_wire.status != "PENDING":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Wire transfer is not in PENDING status",
        )

    db_wire.status = "REJECTED"
    db_wire.approved_by = action_in.approved_by
    db.commit()
    db.refresh(db_wire)
    return db_wire
