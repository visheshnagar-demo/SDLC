import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from server.database import get_db
from server import models, schemas
from server.auth import get_optional_user

router = APIRouter(prefix="/api/v1/billing", tags=["Billing & Invoices"])


@router.get("/invoices", response_model=List[schemas.InvoiceResponse])
def list_invoices(
    patient_id: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
):
    q = db.query(models.Invoice)
    if patient_id:
        q = q.filter(models.Invoice.patient_id == patient_id)
    if status_filter and status_filter.lower() != "all":
        q = q.filter(models.Invoice.status.ilike(status_filter))

    invoices = (
        q.order_by(models.Invoice.created_at.desc()).offset(skip).limit(limit).all()
    )
    return invoices


@router.get("/invoices/{id}", response_model=schemas.InvoiceResponse)
def get_invoice(id: str, db: Session = Depends(get_db)):
    invoice = db.query(models.Invoice).filter(models.Invoice.id == id).first()
    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Invoice {id} not found",
        )
    return invoice


@router.post(
    "/invoices",
    response_model=schemas.InvoiceResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_invoice(
    inv_in: schemas.InvoiceCreate,
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_optional_user),
):
    patient = (
        db.query(models.Patient).filter(models.Patient.id == inv_in.patient_id).first()
    )
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient {inv_in.patient_id} not found",
        )

    invoice_id = str(uuid.uuid4())
    copay = inv_in.copay_amount or 0.0
    balance = max(0.0, inv_in.total_amount - copay)

    invoice = models.Invoice(
        id=invoice_id,
        encounter_id=inv_in.encounter_id,
        patient_id=inv_in.patient_id,
        total_amount=inv_in.total_amount,
        copay_amount=copay,
        patient_balance=balance,
        status="Unpaid",
        due_date=inv_in.due_date,
    )
    db.add(invoice)

    if inv_in.items:
        for item in inv_in.items:
            db_item = models.InvoiceItem(
                id=str(uuid.uuid4()),
                invoice_id=invoice_id,
                description=item.description,
                cpt_code=item.cpt_code,
                amount=item.amount,
            )
            db.add(db_item)

    audit = models.AuditLog(
        id=str(uuid.uuid4()),
        user_id=current_user.id if current_user else None,
        action="CREATE_INVOICE",
        resource_type="Invoice",
        resource_id=invoice_id,
        details=f"Invoice created for patient MRN {patient.mrn} (Total: ${inv_in.total_amount:.2f})",
    )
    db.add(audit)

    db.commit()
    db.refresh(invoice)
    return invoice


@router.post("/invoices/{id}/pay", response_model=schemas.PaymentResponse)
def process_payment(
    id: str,
    payment_in: schemas.PaymentProcess,
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_optional_user),
):
    invoice = db.query(models.Invoice).filter(models.Invoice.id == id).first()
    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Invoice {id} not found",
        )

    if payment_in.amount_paid <= 0:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Payment amount must be greater than zero",
        )

    # Simulated Payment Gateway validation
    if payment_in.card_number and "0000" in payment_in.card_number:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail="Payment Gateway Error: Card declined or insufficient funds",
        )

    # Record Payment
    payment_id = str(uuid.uuid4())
    ref = payment_in.transaction_reference or f"TXN-{uuid.uuid4().hex[:8].upper()}"
    payment = models.Payment(
        id=payment_id,
        invoice_id=invoice.id,
        amount_paid=payment_in.amount_paid,
        payment_method=payment_in.payment_method or "Credit Card",
        cardholder_name=payment_in.cardholder_name,
        transaction_reference=ref,
        payment_status="Success",
    )
    db.add(payment)

    # Update invoice balance and status
    new_balance = max(0.0, invoice.patient_balance - payment_in.amount_paid)
    invoice.patient_balance = new_balance
    if new_balance == 0.0:
        invoice.status = "Paid"

    audit = models.AuditLog(
        id=str(uuid.uuid4()),
        user_id=current_user.id if current_user else None,
        action="PROCESS_PAYMENT",
        resource_type="Payment",
        resource_id=payment_id,
        details=f"Payment of ${payment_in.amount_paid:.2f} processed for Invoice {id} (Ref: {ref})",
    )
    db.add(audit)

    db.commit()
    db.refresh(payment)
    return payment
