from typing import Optional, List
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from server.database import get_db
from server.schemas.loan import LoanCheckoutRequest, LoanResponse, OverdueLoanResponse
from server.services.loan_service import LoanService

router = APIRouter(prefix="/loans", tags=["Loans"])


@router.post(
    "/checkout", response_model=LoanResponse, status_code=status.HTTP_201_CREATED
)
def checkout_book(checkout_in: LoanCheckoutRequest, db: Session = Depends(get_db)):
    return LoanService.checkout_book(db, checkout_in)


@router.get("/overdue", response_model=List[OverdueLoanResponse])
def get_overdue_loans(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    return LoanService.get_overdue_loans(db, skip=skip, limit=limit)


@router.post("/{loan_id}/return", response_model=LoanResponse)
def return_book(loan_id: str, db: Session = Depends(get_db)):
    return LoanService.return_book(db, loan_id)


@router.get("", response_model=List[LoanResponse])
def list_loans(
    patron_id: Optional[str] = Query(None, description="Filter by patron ID"),
    book_id: Optional[str] = Query(None, description="Filter by book ID"),
    status: Optional[str] = Query(
        None, description="Filter by status (ACTIVE, RETURNED)"
    ),
    overdue_only: bool = Query(False, description="Filter only overdue active loans"),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    return LoanService.get_loans(
        db=db,
        patron_id=patron_id,
        book_id=book_id,
        status_filter=status,
        overdue_only=overdue_only,
        skip=skip,
        limit=limit,
    )
