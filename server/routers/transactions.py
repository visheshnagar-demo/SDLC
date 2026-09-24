from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from server.database import get_db
from server.models.entities import Transaction
from server.schemas.transactions import (
    TransactionEvaluateRequest,
    TransactionEvaluateResponse,
    TransactionResponse,
    TransactionListResponse,
)
from server.services.evaluation import evaluate_transaction

router = APIRouter(prefix="/transactions", tags=["Transactions"])


@router.post(
    "/evaluate",
    response_model=TransactionEvaluateResponse,
    summary="Evaluate transaction in real-time against detection rules",
)
def evaluate_tx(
    request: TransactionEvaluateRequest,
    response: Response,
    db: Session = Depends(get_db),
):
    tx, eval_result = evaluate_transaction(db, request)
    if eval_result.is_suspicious:
        response.status_code = status.HTTP_201_CREATED
    else:
        response.status_code = status.HTTP_200_OK
    return eval_result


@router.get(
    "",
    response_model=TransactionListResponse,
    summary="List paginated historical transactions",
)
def get_transactions(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    account_id: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    query = db.query(Transaction)
    if account_id:
        query = query.filter(Transaction.account_id == account_id)

    total = query.count()
    items = query.order_by(desc(Transaction.timestamp)).offset(skip).limit(limit).all()

    return TransactionListResponse(
        total=total,
        skip=skip,
        limit=limit,
        items=[TransactionResponse.model_validate(t) for t in items],
    )


@router.get(
    "/{id}",
    response_model=TransactionResponse,
    summary="Get single transaction by ID",
)
def get_transaction_by_id(
    id: str,
    db: Session = Depends(get_db),
):
    tx = db.query(Transaction).filter(Transaction.id == id).first()
    if not tx:
        raise HTTPException(
            status_code=404, detail=f"Transaction with ID {id} not found"
        )
    return TransactionResponse.model_validate(tx)
