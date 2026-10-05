import uuid
import math
from datetime import datetime, timedelta, timezone
from typing import Optional, List, Dict, Any
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from server.models.book import Book
from server.models.patron import Patron
from server.models.loan import Loan
from server.schemas.loan import LoanCheckoutRequest


class LoanService:
    @staticmethod
    def checkout_book(db: Session, checkout_in: LoanCheckoutRequest) -> Loan:
        patron = db.query(Patron).filter(Patron.id == checkout_in.patron_id).first()
        if not patron:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Patron with ID '{checkout_in.patron_id}' not found.",
            )

        if patron.account_status != "ACTIVE":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Patron account is not active.",
            )

        active_loans_count = (
            db.query(Loan)
            .filter(Loan.patron_id == checkout_in.patron_id, Loan.status == "ACTIVE")
            .count()
        )

        if active_loans_count >= patron.max_borrow_limit:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Patron has reached the maximum borrowing limit of {patron.max_borrow_limit} books.",
            )

        book = db.query(Book).filter(Book.id == checkout_in.book_id).first()
        if not book:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Book with ID '{checkout_in.book_id}' not found.",
            )

        if int(book.available_copies) < 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No available copies of this book for checkout.",
            )

        book.available_copies = int(book.available_copies) - 1

        now = datetime.now(timezone.utc)
        due_date = now + timedelta(days=14)

        loan = Loan(
            id=str(uuid.uuid4()),
            book_id=str(book.id),
            patron_id=str(patron.id),
            checkout_date=now,
            due_date=due_date,
            return_date=None,
            status="ACTIVE",
            fine_amount=0.0,
        )
        db.add(loan)
        db.commit()
        db.refresh(loan)
        return loan

    @staticmethod
    def return_book(db: Session, loan_id: str) -> Loan:
        loan = db.query(Loan).filter(Loan.id == loan_id).first()
        if not loan:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Loan with ID '{loan_id}' not found.",
            )

        if loan.status == "RETURNED":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Book has already been returned for this loan.",
            )

        now = datetime.now(timezone.utc)
        loan.return_date = now
        loan.status = "RETURNED"

        book = db.query(Book).filter(Book.id == loan.book_id).first()
        if book:
            book.available_copies = min(
                int(book.total_copies), int(book.available_copies) + 1
            )

        due_date = loan.due_date
        if due_date.tzinfo is None:
            due_date = due_date.replace(tzinfo=timezone.utc)

        if now > due_date:
            days_diff = (now.date() - due_date.date()).days
            if days_diff > 0:
                overdue_days = days_diff
            else:
                overdue_seconds = (now - due_date).total_seconds()
                overdue_days = max(1, math.ceil(overdue_seconds / 86400))

            if overdue_days > 0:
                fine = round(overdue_days * 0.50, 2)
                loan.fine_amount = fine
                patron = db.query(Patron).filter(Patron.id == loan.patron_id).first()
                if patron:
                    patron.total_fines_due = round(
                        (patron.total_fines_due or 0.0) + fine, 2
                    )

        db.commit()
        db.refresh(loan)
        return loan

    @staticmethod
    def get_loans(
        db: Session,
        patron_id: Optional[str] = None,
        book_id: Optional[str] = None,
        status_filter: Optional[str] = None,
        overdue_only: bool = False,
        skip: int = 0,
        limit: int = 20,
    ) -> List[Loan]:
        query = db.query(Loan)

        if patron_id:
            query = query.filter(Loan.patron_id == patron_id)

        if book_id:
            query = query.filter(Loan.book_id == book_id)

        if status_filter:
            query = query.filter(Loan.status == status_filter.upper())

        if overdue_only:
            now = datetime.now(timezone.utc)
            query = query.filter(Loan.status == "ACTIVE", Loan.due_date < now)

        return query.order_by(Loan.checkout_date.desc()).offset(skip).limit(limit).all()

    @staticmethod
    def get_overdue_loans(
        db: Session, skip: int = 0, limit: int = 20
    ) -> List[Dict[str, Any]]:
        now = datetime.now(timezone.utc)
        loans = (
            db.query(Loan)
            .filter(Loan.status == "ACTIVE", Loan.due_date < now)
            .order_by(Loan.due_date.asc())
            .offset(skip)
            .limit(limit)
            .all()
        )

        results = []
        for loan in loans:
            due_date = loan.due_date
            if due_date.tzinfo is None:
                due_date = due_date.replace(tzinfo=timezone.utc)

            days_diff = (now.date() - due_date.date()).days
            if days_diff > 0:
                overdue_days = days_diff
            else:
                overdue_seconds = (now - due_date).total_seconds()
                overdue_days = max(1, math.ceil(overdue_seconds / 86400))

            fine = round(overdue_days * 0.50, 2)

            results.append(
                {
                    "id": str(loan.id),
                    "book_id": str(loan.book_id),
                    "patron_id": str(loan.patron_id),
                    "checkout_date": loan.checkout_date,
                    "due_date": loan.due_date,
                    "status": "OVERDUE",
                    "overdue_days": overdue_days,
                    "fine_amount": fine,
                    "book_title": loan.book.title if loan.book else None,
                    "patron_name": loan.patron.full_name if loan.patron else None,
                }
            )
        return results
