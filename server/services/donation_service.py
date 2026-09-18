import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from server.database import get_db
from server import models, schemas

router = APIRouter(prefix="/api/v1/donations", tags=["Donations & e-Hundi"])


@router.post(
    "", response_model=schemas.DonationResponse, status_code=status.HTTP_201_CREATED
)
def create_donation(donation_in: schemas.DonationCreate, db: Session = Depends(get_db)):
    count = db.query(models.Donation).count()
    receipt_number = f"RCPT-2026-{(count + 1):06d}"
    tax_80g_ref = (
        f"80G-{uuid.uuid4().hex[:8].upper()}" if donation_in.is_tax_exempt else None
    )

    donation = models.Donation(
        id=str(uuid.uuid4()),
        devotee_id=donation_in.devotee_id,
        receipt_number=receipt_number,
        fund_type=donation_in.fund_type,
        amount=donation_in.amount,
        payment_method=donation_in.payment_method,
        payment_ref=donation_in.payment_ref or f"PAY-{uuid.uuid4().hex[:8].upper()}",
        is_tax_exempt=donation_in.is_tax_exempt,
        tax_80g_ref=tax_80g_ref,
    )
    db.add(donation)
    db.commit()
    db.refresh(donation)
    return donation


@router.get("", response_model=List[schemas.DonationResponse])
def list_donations(
    fund_type: Optional[str] = Query(None),
    payment_method: Optional[str] = Query(None),
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
):
    query = db.query(models.Donation)
    if fund_type:
        query = query.filter(models.Donation.fund_type == fund_type)
    if payment_method:
        query = query.filter(models.Donation.payment_method == payment_method)
    return query.offset(skip).limit(limit).all()


@router.get("/{donation_id}", response_model=schemas.DonationResponse)
def get_donation(donation_id: str, db: Session = Depends(get_db)):
    donation = (
        db.query(models.Donation).filter(models.Donation.id == donation_id).first()
    )
    if not donation:
        donation = (
            db.query(models.Donation)
            .filter(models.Donation.receipt_number == donation_id)
            .first()
        )
    if not donation:
        raise HTTPException(status_code=404, detail="Donation record not found")
    return donation
