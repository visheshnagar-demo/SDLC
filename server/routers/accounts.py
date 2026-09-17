from typing import List
from fastapi import APIRouter, Depends, Query, Path, HTTPException, status
from sqlalchemy.orm import Session
from server.database import get_db, get_password_hash
from server.models import Account, AccountBalance
from server.schemas import AccountCreate, AccountResponse, AccountBalanceResponse

router = APIRouter(prefix="/api/v1/accounts", tags=["Accounts"])


@router.post("", response_model=AccountResponse, status_code=201)
def create_account(payload: AccountCreate, db: Session = Depends(get_db)):
    existing = (
        db.query(Account)
        .filter(
            (Account.account_number == payload.account_number)
            | (Account.owner_email == payload.owner_email)
        )
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Account with provided account_number or email already exists.",
        )

    account = Account(
        account_number=payload.account_number,
        owner_name=payload.owner_name,
        owner_email=payload.owner_email,
        hashed_password=get_password_hash(payload.password)
        if payload.password
        else None,
        role=payload.role,
        status="ACTIVE",
    )
    db.add(account)
    db.commit()
    db.refresh(account)
    return account


@router.get("", response_model=List[AccountResponse])
def list_accounts(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    accounts = db.query(Account).offset(skip).limit(limit).all()
    for acc in accounts:
        for bal in acc.balances:
            if bal.chip:
                setattr(bal, "chip_name", bal.chip.name)
    return accounts


@router.get("/{account_id}/balance", response_model=List[AccountBalanceResponse])
def get_account_balance(account_id: str = Path(...), db: Session = Depends(get_db)):
    account = db.query(Account).filter(Account.id == account_id).first()
    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Account '{account_id}' not found.",
        )

    balances = (
        db.query(AccountBalance).filter(AccountBalance.account_id == account_id).all()
    )
    for bal in balances:
        if bal.chip:
            setattr(bal, "chip_name", bal.chip.name)
    return balances
