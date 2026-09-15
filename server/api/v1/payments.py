import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session
from sqlalchemy import or_

from server.database import get_db
from server.models import Transaction
from server.schemas import (
    CheckoutSessionRequest,
    CheckoutSessionResponse,
    DigitalWalletPaymentRequest,
    DigitalWalletPaymentResponse,
    ExchangeRatesResponse,
    TransactionDetail,
    TransactionSummary,
    RefundSummary,
)
from server.services.stripe_service import create_checkout_session
from server.services.wallet_service import process_digital_wallet_payment
from server.services.currency_service import get_cached_rates

router = APIRouter(prefix="/payments", tags=["payments"])


@router.post("/checkout-session", response_model=CheckoutSessionResponse)
def create_session(
    payload: CheckoutSessionRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    ip_address = request.client.host if request.client else "127.0.0.1"
    items_dicts = [item.model_dump() for item in payload.items] if payload.items else []
    session, _ = create_checkout_session(
        db=db,
        amount=payload.amount,
        currency=payload.currency,
        customer_email=payload.customer_email,
        items=items_dicts,
        ip_address=ip_address,
    )

    return CheckoutSessionResponse(
        session_id=session.session_id,
        payment_intent_id=session.payment_intent_id,
        client_secret=session.client_secret,
        base_amount=session.amount,
        base_currency=session.currency,
        target_amount=session.target_amount,
        target_currency=session.target_currency,
        exchange_rate=session.exchange_rate,
    )


@router.post("/digital-wallet", response_model=DigitalWalletPaymentResponse)
def pay_digital_wallet(
    payload: DigitalWalletPaymentRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    ip_address = request.client.host if request.client else "127.0.0.1"
    tx = process_digital_wallet_payment(
        db=db,
        wallet_type=payload.wallet_type,
        payment_token=payload.payment_token,
        amount=payload.amount,
        currency=payload.currency,
        customer_email=payload.customer_email or "customer@example.com",
        ip_address=ip_address,
    )

    return DigitalWalletPaymentResponse(
        transaction_id=tx.id,
        payment_intent_id=tx.payment_intent_id,
        wallet_type=tx.payment_method,
        amount=tx.converted_amount,
        currency=tx.target_currency,
        status=tx.status,
    )


@router.get("/rates", response_model=ExchangeRatesResponse)
def get_rates(
    base_currency: str = Query("USD", description="Base currency code"),
    db: Session = Depends(get_db),
):
    rates = get_cached_rates(db, base_currency=base_currency)
    return ExchangeRatesResponse(
        base_currency=base_currency.upper(),
        rates=rates,
        timestamp=datetime.datetime.now(datetime.timezone.utc).isoformat(),
    )


@router.get("/transactions", response_model=list[TransactionSummary])
def list_transactions(
    search: Optional[str] = Query(None, description="Search transaction ID or email"),
    status: Optional[str] = Query(None, description="Filter by transaction status"),
    currency: Optional[str] = Query(None, description="Filter by currency"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
):
    query = db.query(Transaction)

    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            or_(
                Transaction.id.ilike(search_pattern),
                Transaction.customer_email.ilike(search_pattern),
            )
        )

    if status:
        query = query.filter(Transaction.status == status.upper())

    if currency:
        query = query.filter(
            or_(
                Transaction.base_currency == currency.upper(),
                Transaction.target_currency == currency.upper(),
            )
        )

    query = query.order_by(Transaction.created_at.desc())
    transactions = query.offset(skip).limit(limit).all()

    return [
        TransactionSummary(
            id=str(tx.id),
            payment_intent_id=str(tx.payment_intent_id),
            customer_email=str(tx.customer_email),
            payment_method=str(tx.payment_method),
            amount=float(tx.converted_amount),
            currency=str(tx.target_currency),
            status=str(tx.status),
            created_at=tx.created_at,
        )
        for tx in transactions
    ]


@router.get("/transactions/{transaction_id}", response_model=TransactionDetail)
def get_transaction(
    transaction_id: str,
    db: Session = Depends(get_db),
):
    tx = db.query(Transaction).filter(Transaction.id == transaction_id).first()
    if not tx:
        raise HTTPException(
            status_code=404,
            detail=f"Transaction '{transaction_id}' not found.",
        )

    refund_summaries = [
        RefundSummary(
            id=str(ref.id),
            transaction_id=str(ref.transaction_id),
            refund_amount=float(ref.refund_amount),
            currency=str(ref.currency),
            reason=str(ref.reason),
            memo=ref.memo,
            status=str(ref.status),
            created_at=ref.created_at,
        )
        for ref in tx.refunds
    ]

    return TransactionDetail(
        id=str(tx.id),
        payment_intent_id=str(tx.payment_intent_id),
        customer_email=str(tx.customer_email),
        payment_method=str(tx.payment_method),
        amount=float(tx.amount),
        base_currency=str(tx.base_currency),
        target_currency=str(tx.target_currency),
        converted_amount=float(tx.converted_amount),
        exchange_rate=float(tx.exchange_rate),
        status=str(tx.status),
        refunded_amount=float(tx.refunded_amount),
        remaining_refundable_balance=float(tx.remaining_refundable_balance),
        refunds=refund_summaries,
        created_at=tx.created_at,
    )
