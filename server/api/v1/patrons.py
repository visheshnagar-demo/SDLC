from typing import Optional, List
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from server.database import get_db
from server.schemas.patron import PatronCreate, PatronUpdate, PatronResponse
from server.schemas.loan import LoanResponse
from server.services.patron_service import PatronService

router = APIRouter(prefix="/patrons", tags=["Patrons"])


@router.post("", response_model=PatronResponse, status_code=status.HTTP_201_CREATED)
def create_patron(patron_in: PatronCreate, db: Session = Depends(get_db)):
    return PatronService.create_patron(db, patron_in)


@router.get("", response_model=List[PatronResponse])
def list_patrons(
    search: Optional[str] = Query(None, description="Search by patron name or email"),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    return PatronService.get_patrons(db=db, search=search, skip=skip, limit=limit)


@router.get("/{patron_id}", response_model=PatronResponse)
def get_patron(patron_id: str, db: Session = Depends(get_db)):
    return PatronService.get_patron_by_id(db, patron_id)


@router.put("/{patron_id}", response_model=PatronResponse)
def update_patron(
    patron_id: str, patron_update: PatronUpdate, db: Session = Depends(get_db)
):
    return PatronService.update_patron(db, patron_id, patron_update)


@router.get("/{patron_id}/loans", response_model=List[LoanResponse])
def get_patron_loans(
    patron_id: str,
    status: Optional[str] = Query(
        None, description="Filter loans by status (ACTIVE, RETURNED)"
    ),
    db: Session = Depends(get_db),
):
    return PatronService.get_patron_loans(db, patron_id=patron_id, status_filter=status)
