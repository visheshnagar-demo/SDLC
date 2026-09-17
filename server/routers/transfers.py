from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from server.database import get_db
from server.schemas import (
    AllocateRequest,
    TransferRequest,
    RedeemRequest,
    AdjustRequest,
    TransactionResponse,
)
from server.services import transfer_service

router = APIRouter(prefix="/transfers", tags=["Transfers"])


@router.post("/allocate", response_model=TransactionResponse, status_code=201)
def allocate(req: AllocateRequest, db: Session = Depends(get_db)):
    txn = transfer_service.allocate_chips(db, req)
    return TransactionResponse.model_validate(txn)


@router.post("/transfer", response_model=TransactionResponse, status_code=200)
def transfer(req: TransferRequest, db: Session = Depends(get_db)):
    txn = transfer_service.transfer_chips(db, req)
    return TransactionResponse.model_validate(txn)


@router.post("/redeem", response_model=TransactionResponse, status_code=200)
def redeem(req: RedeemRequest, db: Session = Depends(get_db)):
    txn = transfer_service.redeem_chips(db, req)
    return TransactionResponse.model_validate(txn)


@router.post("/adjust", response_model=TransactionResponse, status_code=200)
def adjust(req: AdjustRequest, db: Session = Depends(get_db)):
    txn = transfer_service.adjust_chips(db, req)
    return TransactionResponse.model_validate(txn)
