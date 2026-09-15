from typing import Optional
from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.orm import Session

from server.database import get_db
from server.models import Refund
from server.schemas import RefundRequest, RefundSummary
from server.services.stripe_service import process_refund

router = APIRouter(prefix="/refunds", tags=["refunds"])


@router.post("", response_model=RefundSummary)
def create_refund_endpoint(
    payload: RefundRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    ip_address = request.client.host if request.client else "127.0.0.1"
    refund = process_refund(
        db=db,
        transaction_id=payload.transaction_id,
        amount=payload.amount,
        reason=payload.reason,
        memo=payload.memo,
        ip_address=ip_address,
    )
    return RefundSummary(
        id=refund.id,
        transaction_id=refund.transaction_id,
        refund_amount=refund.refund_amount,
        currency=refund.currency,
        reason=refund.reason,
        memo=refund.memo,
        status=refund.status,
        created_at=refund.created_at,
    )


@router.get("", response_model=list[RefundSummary])
def list_refunds_endpoint(
    transaction_id: Optional[str] = Query(None, description="Filter by transaction ID"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
):
    query = db.query(Refund)
    if transaction_id:
        query = query.filter(Refund.transaction_id == transaction_id)

    query = query.order_by(Refund.created_at.desc())
    refunds = query.offset(skip).limit(limit).all()

    return [
        RefundSummary(
            id=ref.id,
            transaction_id=ref.transaction_id,
            refund_amount=ref.refund_amount,
            currency=ref.currency,
            reason=ref.reason,
            memo=ref.memo,
            status=ref.status,
            created_at=ref.created_at,
        )
        for ref in refunds
    ]
