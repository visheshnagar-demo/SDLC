from typing import Optional
from fastapi import APIRouter, Depends, Header, HTTPException, Query, Response, status
from sqlalchemy.orm import Session

from server.database import get_db
from server.models import FixedDepositAccount
from server.schemas import (
    FDRatesResponse,
    FDCreateRequest,
    FDCreateResponse,
    FDAccountSummary,
)
from server.services.rates_service import get_fd_rates_and_projection
from server.services.fd_service import create_fixed_deposit
from server.services.receipt_service import get_or_create_receipt

router = APIRouter(prefix="/fixed-deposits", tags=["Fixed Deposits"])


@router.get("/rates", response_model=FDRatesResponse)
def get_interest_rates_and_projections(
    deposit_amount: Optional[float] = Query(None, description="Principal deposit amount in USD"),
    tenure_months: Optional[int] = Query(None, description="Tenure in months (e.g. 6, 12, 24, 36)"),
    payout_frequency: Optional[str] = Query("AT_MATURITY", description="Payout frequency"),
    db: Session = Depends(get_db),
):
    """
    Retrieve available Fixed Deposit tenure slabs, interest rates,
    and dynamically calculate projected maturity returns.
    """
    return get_fd_rates_and_projection(
        db=db,
        deposit_amount=deposit_amount,
        tenure_months=tenure_months,
        payout_frequency=payout_frequency or "AT_MATURITY",
    )


@router.post("", response_model=FDCreateResponse, status_code=status.HTTP_201_CREATED)
def open_fixed_deposit(
    request: FDCreateRequest,
    idempotency_key: Optional[str] = Header(None, alias="Idempotency-Key"),
    db: Session = Depends(get_db),
):
    """
    Atomically provision a Fixed Deposit account, verify 4-digit PIN,
    debit the selected savings account, and issue advice receipt.
    """
    return create_fixed_deposit(
        db=db,
        request=request,
        idempotency_key=idempotency_key,
    )


@router.get("/{fd_id}/receipt")
def download_fd_advice_receipt(
    fd_id: str,
    db: Session = Depends(get_db),
):
    """
    Generate and download the official Fixed Deposit Advice Certificate PDF.
    """
    pdf_bytes = get_or_create_receipt(db=db, fd_id=fd_id)
    if not pdf_bytes:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Fixed Deposit account or receipt not found.",
        )

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="FD_Advice_Receipt_{fd_id[:8]}.pdf"',
            "Content-Type": "application/pdf",
        },
    )


@router.get("", response_model=list[FDAccountSummary])
def list_fixed_deposits(
    customer_id: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    """
    List all Fixed Deposit accounts for customer.
    """
    query = db.query(FixedDepositAccount)
    if customer_id:
        query = query.filter(FixedDepositAccount.customer_id == customer_id)
    fds = query.order_by(FixedDepositAccount.created_at.desc()).all()

    return [
        FDAccountSummary(
            id=f.id,
            fd_account_number=f.fd_account_number,
            source_account_id=f.source_account_id,
            deposit_amount=f.deposit_amount,
            interest_rate=f.interest_rate,
            tenure_months=f.tenure_months,
            payout_frequency=f.payout_frequency,
            maturity_amount=f.maturity_amount,
            maturity_date=f.maturity_date.strftime("%Y-%m-%d"),
            status=f.status,
            created_at=f.created_at.isoformat() + "Z" if f.created_at else None,
        )
        for f in fds
    ]


@router.get("/{fd_id}", response_model=FDAccountSummary)
def get_fixed_deposit_detail(
    fd_id: str,
    db: Session = Depends(get_db),
):
    """
    Get details of a specific Fixed Deposit account.
    """
    f = db.query(FixedDepositAccount).filter(FixedDepositAccount.id == fd_id).first()
    if not f:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Fixed Deposit account not found.",
        )

    return FDAccountSummary(
        id=f.id,
        fd_account_number=f.fd_account_number,
        source_account_id=f.source_account_id,
        deposit_amount=f.deposit_amount,
        interest_rate=f.interest_rate,
        tenure_months=f.tenure_months,
        payout_frequency=f.payout_frequency,
        maturity_amount=f.maturity_amount,
        maturity_date=f.maturity_date.strftime("%Y-%m-%d"),
        status=f.status,
        created_at=f.created_at.isoformat() + "Z" if f.created_at else None,
    )
