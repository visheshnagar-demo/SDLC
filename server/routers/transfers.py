from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from server.database import get_db
from server.schemas import (
    AllocationRequest,
    TransferRequest,
    RedemptionRequest,
    TransactionResponse,
)
from server.services.transfer_service import (
    allocate_chips,
    transfer_chips,
    redeem_chips,
)

router = APIRouter(prefix="/api/v1/transfers", tags=["Transfers & Allocations"])


@router.post("/allocate", response_model=TransactionResponse, status_code=200)
def allocate(payload: AllocationRequest, db: Session = Depends(get_db)):
    return allocate_chips(
        db,
        account_id=payload.account_id,
        chip_id=payload.chip_id,
        amount=payload.amount,
        reason=payload.reason,
    )


@router.post("/transfer", response_model=TransactionResponse, status_code=200)
def transfer(payload: TransferRequest, db: Session = Depends(get_db)):
    return transfer_chips(
        db,
        source_account_id=payload.source_account_id,
        destination_account_id=payload.destination_account_id,
        chip_id=payload.chip_id,
        amount=payload.amount,
        reason=payload.reason,
    )


@router.post("/redeem", response_model=TransactionResponse, status_code=200)
def redeem(payload: RedemptionRequest, db: Session = Depends(get_db)):
    return redeem_chips(
        db,
        account_id=payload.account_id,
        chip_id=payload.chip_id,
        amount=payload.amount,
        reason=payload.reason,
    )
