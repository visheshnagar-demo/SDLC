from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from server.database import get_db
from server.schemas import SavingsAccountListResponse
from server.services.account_service import get_savings_accounts

router = APIRouter(tags=["Savings Accounts"])


@router.get("/savings-accounts", response_model=SavingsAccountListResponse)
def list_savings_accounts(
    customer_id: Optional[str] = Query(None, description="Optional customer ID"),
    db: Session = Depends(get_db),
):
    """
    Fetch eligible and active savings accounts for the authenticated customer.
    Evaluates minimum balance ($500.00) and status eligibility for Fixed Deposit opening.
    """
    return get_savings_accounts(db=db, customer_id=customer_id)
