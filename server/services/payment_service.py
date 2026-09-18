import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from server.database import get_db
from server import models

router = APIRouter(prefix="/api/v1/payments", tags=["Payments & Checkout"])


class CartItem(BaseModel):
    name: Optional[str] = "Donation Fund"
    quantity: Optional[int] = 1
    unit_amount: Optional[float] = None
    unit_price: Optional[float] = None
    price: Optional[float] = None


class CheckoutSessionRequest(BaseModel):
    amount: Optional[float] = 100.0
    currency: Optional[str] = "USD"
    customer_email: Optional[str] = None
    email: Optional[str] = None
    items: Optional[List[CartItem]] = None
    fund_type: Optional[str] = None
    devotee_id: Optional[str] = None
    payment_method: Optional[str] = "card"
    is_tax_exempt: Optional[bool] = True


@router.post("/checkout-session", status_code=status.HTTP_200_OK)
def create_checkout_session(
    payload: CheckoutSessionRequest, db: Session = Depends(get_db)
):
    amt = payload.amount or 100.0
    if payload.items and len(payload.items) > 0:
        item = payload.items[0]
        if item.unit_amount is not None:
            amt = item.unit_amount * (item.quantity or 1)
        elif item.unit_price is not None:
            amt = item.unit_price * (item.quantity or 1)
        elif item.price is not None:
            amt = item.price * (item.quantity or 1)

    fund_type = payload.fund_type
    if not fund_type and payload.items and len(payload.items) > 0:
        fund_type = payload.items[0].name
    if not fund_type:
        fund_type = "Annadanam Fund"

    count = db.query(models.Donation).count()
    receipt_number = f"RCPT-2026-{(count + 1):06d}"
    tax_80g_ref = f"80G-{uuid.uuid4().hex[:8].upper()}"

    donation = models.Donation(
        id=str(uuid.uuid4()),
        devotee_id=payload.devotee_id,
        receipt_number=receipt_number,
        fund_type=fund_type,
        amount=amt,
        payment_method=payload.payment_method or "card",
        payment_ref=f"PAY-{uuid.uuid4().hex[:8].upper()}",
        is_tax_exempt=payload.is_tax_exempt
        if payload.is_tax_exempt is not None
        else True,
        tax_80g_ref=tax_80g_ref,
    )
    db.add(donation)
    db.commit()
    db.refresh(donation)

    session_id = f"cs_test_{uuid.uuid4().hex[:12]}"
    return {
        "id": session_id,
        "session_id": session_id,
        "status": "succeeded",
        "amount": amt,
        "currency": payload.currency or "USD",
        "customer_email": payload.customer_email
        or payload.email
        or "donor@example.com",
        "checkout_url": f"https://checkout.stripe.com/pay/{session_id}",
        "items": payload.items or [],
        "receipt_number": receipt_number,
        "donation_id": donation.id,
    }


@router.get("/transactions", status_code=status.HTTP_200_OK)
def list_transactions(db: Session = Depends(get_db)):
    donations = db.query(models.Donation).all()
    txns = []
    for d in donations:
        txns.append(
            {
                "id": d.id,
                "transaction_id": d.payment_ref or d.id,
                "receipt_number": d.receipt_number,
                "amount": d.amount,
                "currency": "USD",
                "status": "succeeded",
                "fund_type": d.fund_type,
                "payment_method": d.payment_method,
                "customer_email": "donor@example.com",
                "created_at": d.created_at.isoformat() if d.created_at else None,
            }
        )
    return txns


@router.get("/transactions/{transaction_id}", status_code=status.HTTP_200_OK)
def get_transaction(transaction_id: str, db: Session = Depends(get_db)):
    d = db.query(models.Donation).filter(models.Donation.id == transaction_id).first()
    if not d:
        d = (
            db.query(models.Donation)
            .filter(models.Donation.receipt_number == transaction_id)
            .first()
        )
    if not d:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return {
        "id": d.id,
        "transaction_id": d.payment_ref or d.id,
        "receipt_number": d.receipt_number,
        "amount": d.amount,
        "currency": "USD",
        "status": "succeeded",
        "fund_type": d.fund_type,
        "payment_method": d.payment_method,
        "customer_email": "donor@example.com",
        "created_at": d.created_at.isoformat() if d.created_at else None,
    }
