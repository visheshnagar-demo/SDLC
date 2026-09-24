from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from server.database import get_db
from server.schemas import (
    MuseumLoanCreate,
    LoanStatusUpdate,
    MuseumLoanResponse
)
from server.services.loan_service import LoanService

router = APIRouter(prefix="/api/v1/loans", tags=["Museum Loans"])


@router.get("", response_model=List[MuseumLoanResponse])
def list_loans(
    status: Optional[str] = Query(None, description="Filter by status (Requested, Approved, In Transit, Active Loan, Returned, Cancelled)"),
    partner_museum: Optional[str] = Query(None, description="Filter by partner museum name"),
    artifact_id: Optional[str] = Query(None, description="Filter by artifact ID"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db)
):
    return LoanService.get_loans(
        db=db,
        status_filter=status,
        partner_museum=partner_museum,
        artifact_id=artifact_id,
        skip=skip,
        limit=limit
    )


@router.post("", response_model=MuseumLoanResponse, status_code=status.HTTP_201_CREATED)
def create_loan(
    loan_in: MuseumLoanCreate,
    db: Session = Depends(get_db)
):
    return LoanService.create_loan(db=db, loan_in=loan_in)


@router.get("/{id}", response_model=MuseumLoanResponse)
def get_loan(
    id: str,
    db: Session = Depends(get_db)
):
    return LoanService.get_loan_by_id(db=db, loan_id=id)


@router.put("/{id}/status", response_model=MuseumLoanResponse)
def update_loan_status(
    id: str,
    status_in: LoanStatusUpdate,
    db: Session = Depends(get_db)
):
    return LoanService.update_loan_status(db=db, loan_id=id, status_in=status_in)
