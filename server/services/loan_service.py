from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from server.models import MuseumLoan, Artifact
from server.schemas import MuseumLoanCreate, LoanStatusUpdate


class LoanService:
    @staticmethod
    def get_loans(
        db: Session,
        status_filter: Optional[str] = None,
        partner_museum: Optional[str] = None,
        artifact_id: Optional[str] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[MuseumLoan]:
        query = db.query(MuseumLoan).order_by(MuseumLoan.loan_start_date.desc(), MuseumLoan.created_at.desc())
        if status_filter and status_filter != "All Statuses":
            query = query.filter(MuseumLoan.loan_status == status_filter)
        if partner_museum:
            query = query.filter(MuseumLoan.partner_museum_name.ilike(f"%{partner_museum}%"))
        if artifact_id:
            query = query.filter(MuseumLoan.artifact_id == artifact_id)
        return query.offset(skip).limit(limit).all()

    @staticmethod
    def get_loan_by_id(db: Session, loan_id: str) -> MuseumLoan:
        loan = db.query(MuseumLoan).filter(MuseumLoan.id == loan_id).first()
        if not loan:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Loan agreement with ID '{loan_id}' not found."
            )
        return loan

    @staticmethod
    def create_loan(db: Session, loan_in: MuseumLoanCreate) -> MuseumLoan:
        artifact = db.query(Artifact).filter(Artifact.id == loan_in.artifact_id).first()
        if not artifact:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Artifact with ID '{loan_in.artifact_id}' not found."
            )

        # Validate artifact availability
        if artifact.status in ["Under Restoration", "On Loan"]:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Artifact '{artifact.title}' ({artifact.accession_no}) is currently '{artifact.status}' and cannot be assigned to a new loan."
            )

        # Check existing active loans for this artifact
        existing_active = db.query(MuseumLoan).filter(
            MuseumLoan.artifact_id == loan_in.artifact_id,
            MuseumLoan.loan_status.in_(["Requested", "Approved", "In Transit", "Active Loan"])
        ).first()
        if existing_active:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Artifact already has an active loan agreement ({existing_active.id}) with status '{existing_active.loan_status}'."
            )

        loan = MuseumLoan(**loan_in.model_dump())
        db.add(loan)
        db.commit()
        db.refresh(loan)
        return loan

    @staticmethod
    def update_loan_status(db: Session, loan_id: str, status_in: LoanStatusUpdate) -> MuseumLoan:
        loan = LoanService.get_loan_by_id(db, loan_id)
        artifact = db.query(Artifact).filter(Artifact.id == loan.artifact_id).first()

        new_status = status_in.loan_status
        loan.loan_status = new_status

        if status_in.transit_notes:
            if loan.transit_requirements:
                loan.transit_requirements = f"{loan.transit_requirements}\n[Transit Note]: {status_in.transit_notes}"
            else:
                loan.transit_requirements = status_in.transit_notes

        if status_in.return_inspection_notes:
            loan.return_inspection_notes = status_in.return_inspection_notes

        # Sync artifact status
        if artifact:
            if new_status in ["In Transit", "Active Loan"]:
                artifact.status = "On Loan"
            elif new_status in ["Returned", "Cancelled"]:
                artifact.status = "In Storage"

        db.commit()
        db.refresh(loan)
        return loan
