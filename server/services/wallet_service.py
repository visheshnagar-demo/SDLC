import uuid
from sqlalchemy.orm import Session
from fastapi import HTTPException
from server.models import Transaction
from server.services.audit_service import create_audit_log
from server.services.currency_service import convert_currency, SUPPORTED_CURRENCIES


def process_digital_wallet_payment(
    db: Session,
    wallet_type: str,
    payment_token: str,
    amount: float,
    currency: str = "USD",
    customer_email: str = "customer@example.com",
    ip_address: str = "127.0.0.1",
) -> Transaction:
    wallet_type_normalized = wallet_type.lower()
    if wallet_type_normalized not in ["apple_pay", "google_pay"]:
        raise HTTPException(
            status_code=422,
            detail=f"Unsupported wallet type '{wallet_type}'. Supported: apple_pay, google_pay",
        )

    if (
        not payment_token
        or payment_token.startswith("tok_invalid")
        or payment_token.startswith("tok_expired")
    ):
        raise HTTPException(
            status_code=422,
            detail="Wallet payment token is invalid or has expired.",
        )

    target_currency = currency.upper()
    if target_currency not in SUPPORTED_CURRENCIES:
        raise HTTPException(
            status_code=422,
            detail=f"Currency '{target_currency}' is not supported.",
        )

    converted_amount, rate = convert_currency(
        db, amount=amount, from_currency="USD", to_currency=target_currency
    )

    tx_uuid = uuid.uuid4().hex[:12]
    tx_id = f"tx_{tx_uuid}"
    payment_intent_id = f"pi_wallet_{tx_uuid}"

    transaction = Transaction(
        id=tx_id,
        payment_intent_id=payment_intent_id,
        customer_email=customer_email,
        payment_method=wallet_type_normalized,
        amount=amount,
        base_currency="USD",
        target_currency=target_currency,
        converted_amount=converted_amount,
        exchange_rate=rate,
        status="COMPLETED",
        refunded_amount=0.0,
        remaining_refundable_balance=amount,
    )
    db.add(transaction)
    db.commit()
    db.refresh(transaction)

    create_audit_log(
        db=db,
        event_type=f"wallet.payment.{wallet_type_normalized}.authorized",
        transaction_id=tx_id,
        ip_address=ip_address,
        payload={
            "wallet_type": wallet_type_normalized,
            "payment_intent_id": payment_intent_id,
            "customer_email": customer_email,
            "amount": amount,
            "currency": target_currency,
            "status": "COMPLETED",
        },
    )

    return transaction
