import datetime
from fastapi import APIRouter, Depends, Header, HTTPException, Request
from sqlalchemy.orm import Session

from server.database import get_db
from server.models import Transaction, WebhookEvent
from server.services.stripe_service import verify_webhook_signature
from server.services.audit_service import create_audit_log

router = APIRouter(prefix="/webhooks", tags=["webhooks"])


@router.post("/stripe")
async def handle_stripe_webhook(
    request: Request,
    stripe_signature: str | None = Header(None, alias="stripe-signature"),
    db: Session = Depends(get_db),
):
    body_bytes = await request.body()

    if not verify_webhook_signature(body_bytes, stripe_signature):
        raise HTTPException(status_code=401, detail="Invalid Stripe webhook signature.")

    try:
        import json

        payload = json.loads(body_bytes.decode("utf-8"))
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON payload.")

    event_id = payload.get("id", f"evt_{datetime.datetime.now().timestamp()}")
    event_type = payload.get("type", "unknown")
    event_data = payload.get("data", {}).get("object", {})

    # Idempotency check
    existing_event = db.query(WebhookEvent).filter(WebhookEvent.id == event_id).first()
    if existing_event:
        return {"status": "duplicate", "message": "Event already processed"}

    # Record event
    webhook_record = WebhookEvent(
        id=event_id,
        event_type=event_type,
        processed_at=datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None),
    )
    db.add(webhook_record)

    payment_intent_id = event_data.get("id") or event_data.get("payment_intent")
    matched_tx = None

    if payment_intent_id:
        matched_tx = (
            db.query(Transaction)
            .filter(Transaction.payment_intent_id == payment_intent_id)
            .first()
        )

    if matched_tx:
        if event_type == "payment_intent.succeeded":
            matched_tx.status = "COMPLETED"
        elif event_type == "payment_intent.payment_failed":
            matched_tx.status = "FAILED"
        elif event_type == "charge.refunded":
            matched_tx.status = "REFUNDED"
            matched_tx.remaining_refundable_balance = 0.0

    db.commit()

    ip_address = request.client.host if request.client else "127.0.0.1"
    create_audit_log(
        db=db,
        event_type=event_type,
        transaction_id=matched_tx.id if matched_tx else None,
        ip_address=ip_address,
        payload=payload,
    )

    return {"status": "success", "event_id": event_id, "type": event_type}
