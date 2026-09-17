import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from server.database import get_db
from server.models import Account, AccountBalance, ChipDefinition
from server.schemas import (
    AccountCreate,
    AccountResponse,
    AccountBalanceResponse,
    BalanceBreakdownResponse,
)

router = APIRouter(prefix="/accounts", tags=["Accounts"])


@router.post("", response_model=AccountResponse, status_code=201)
def create_account(account_in: AccountCreate, db: Session = Depends(get_db)):
    existing = (
        db.query(Account)
        .filter(
            (Account.account_number == account_in.account_number)
            | (Account.owner_email == account_in.owner_email)
        )
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=400, detail="Account with this number or email already exists"
        )

    account = Account(
        id=str(uuid.uuid4()),
        account_number=account_in.account_number,
        owner_name=account_in.owner_name,
        owner_email=account_in.owner_email,
        role=account_in.role,
        status=account_in.status,
    )
    db.add(account)
    db.commit()
    db.refresh(account)
    return AccountResponse.model_validate(account)


@router.get("", response_model=List[AccountResponse])
def list_accounts(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    accounts = db.query(Account).offset(skip).limit(limit).all()
    res = []
    for acc in accounts:
        balances = (
            db.query(AccountBalance).filter(AccountBalance.account_id == acc.id).all()
        )
        bal_res = []
        for b in balances:
            chip = (
                db.query(ChipDefinition).filter(ChipDefinition.id == b.chip_id).first()
            )
            bal_res.append(
                AccountBalanceResponse(
                    id=b.id,
                    account_id=b.account_id,
                    chip_id=b.chip_id,
                    balance=b.balance,
                    updated_at=b.updated_at,
                    chip_name=chip.name if chip else "Unknown",
                )
            )
        res.append(
            AccountResponse(
                id=acc.id,
                account_number=acc.account_number,
                owner_name=acc.owner_name,
                owner_email=acc.owner_email,
                role=acc.role,
                status=acc.status,
                created_at=acc.created_at,
                balances=bal_res,
            )
        )
    return res


@router.get("/{account_id}/balance", response_model=BalanceBreakdownResponse)
def get_account_balance(account_id: str, db: Session = Depends(get_db)):
    account = db.query(Account).filter(Account.id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")

    balances = (
        db.query(AccountBalance).filter(AccountBalance.account_id == account_id).all()
    )
    bal_res = []
    total = 0
    for b in balances:
        chip = db.query(ChipDefinition).filter(ChipDefinition.id == b.chip_id).first()
        bal_res.append(
            AccountBalanceResponse(
                id=b.id,
                account_id=b.account_id,
                chip_id=b.chip_id,
                balance=b.balance,
                updated_at=b.updated_at,
                chip_name=chip.name if chip else "Unknown",
            )
        )
        total += b.balance

    return BalanceBreakdownResponse(
        account_id=account.id,
        account_number=account.account_number,
        owner_name=account.owner_name,
        total_balance=total,
        balances=bal_res,
    )
