import uuid
from typing import Optional, List
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from server.models.patron import Patron
from server.models.loan import Loan
from server.schemas.patron import PatronCreate, PatronUpdate


class PatronService:
    @staticmethod
    def create_patron(db: Session, patron_in: PatronCreate) -> Patron:
        existing = db.query(Patron).filter(Patron.email == patron_in.email).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Patron with email '{patron_in.email}' already exists.",
            )

        patron = Patron(
            id=str(uuid.uuid4()),
            full_name=patron_in.full_name,
            email=patron_in.email,
            phone_number=patron_in.phone_number,
            max_borrow_limit=5,
            account_status="ACTIVE",
            total_fines_due=0.0,
        )
        db.add(patron)
        db.commit()
        db.refresh(patron)
        return patron

    @staticmethod
    def get_patrons(
        db: Session, search: Optional[str] = None, skip: int = 0, limit: int = 20
    ) -> List[Patron]:
        query = db.query(Patron)
        if search:
            search_pattern = f"%{search}%"
            query = query.filter(
                or_(
                    Patron.full_name.ilike(search_pattern),
                    Patron.email.ilike(search_pattern),
                )
            )
        return query.order_by(Patron.full_name.asc()).offset(skip).limit(limit).all()

    @staticmethod
    def get_patron_by_id(db: Session, patron_id: str) -> Patron:
        patron = db.query(Patron).filter(Patron.id == patron_id).first()
        if not patron:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Patron with ID '{patron_id}' not found.",
            )
        return patron

    @staticmethod
    def update_patron(
        db: Session, patron_id: str, patron_update: PatronUpdate
    ) -> Patron:
        patron = PatronService.get_patron_by_id(db, patron_id)
        update_data = patron_update.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            if value is not None:
                setattr(patron, key, value)
        db.commit()
        db.refresh(patron)
        return patron

    @staticmethod
    def get_patron_loans(
        db: Session, patron_id: str, status_filter: Optional[str] = None
    ) -> List[Loan]:
        PatronService.get_patron_by_id(db, patron_id)
        query = db.query(Loan).filter(Loan.patron_id == patron_id)
        if status_filter:
            query = query.filter(Loan.status == status_filter.upper())
        return query.order_by(Loan.checkout_date.desc()).all()
