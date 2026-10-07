import uuid
import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from server.database import get_db
from server.models import Invoice, InvoiceItem
from server.schemas import (
    InvoiceItemCreate,
    InvoiceItemResponse,
    PaymentRequest,
    InvoiceResponse,
)
from server.routers.bookings import _format_booking_response, _format_guest_response

router = APIRouter()


def _format_invoice_item(item: InvoiceItem) -> InvoiceItemResponse:
    return InvoiceItemResponse(
        id=item.id,
        invoice_id=item.invoice_id,
        description=item.description,
        item_type=item.item_type,
        unit_price=item.unit_price,
        quantity=item.quantity,
        total_price=item.total_price,
        created_at=item.created_at,
    )


def _format_invoice_response(invoice: Invoice) -> InvoiceResponse:
    items_formatted = [_format_invoice_item(i) for i in invoice.items]
    booking_formatted = (
        _format_booking_response(invoice.booking) if invoice.booking else None
    )
    guest_formatted = _format_guest_response(invoice.guest) if invoice.guest else None

    return InvoiceResponse(
        id=invoice.id,
        invoice_number=invoice.invoice_number,
        booking_id=invoice.booking_id,
        guest_id=invoice.guest_id,
        room_charges=invoice.room_charges,
        service_charges=invoice.service_charges,
        tax_amount=invoice.tax_amount,
        total_payable=invoice.total_payable,
        payment_status=invoice.payment_status,
        payment_method=invoice.payment_method,
        paid_at=invoice.paid_at,
        created_at=invoice.created_at,
        updated_at=invoice.updated_at,
        items=items_formatted,
        booking=booking_formatted,
        guest=guest_formatted,
    )


def _recalculate_invoice_totals(invoice: Invoice, db: Session):
    room_charges = 0.0
    service_charges = 0.0

    for item in invoice.items:
        if item.item_type == "RoomFee":
            room_charges += item.total_price
        else:
            service_charges += item.total_price

    tax_rate = 0.10  # 10% tax
    tax_amount = round((room_charges + service_charges) * tax_rate, 2)
    total_payable = round(room_charges + service_charges + tax_amount, 2)

    invoice.room_charges = round(room_charges, 2)
    invoice.service_charges = round(service_charges, 2)
    invoice.tax_amount = tax_amount
    invoice.total_payable = total_payable
    invoice.updated_at = datetime.datetime.now(datetime.timezone.utc).replace(
        tzinfo=None
    )
    db.commit()
    db.refresh(invoice)


@router.get("", response_model=List[InvoiceResponse])
def list_invoices(
    booking_id: Optional[str] = Query(None, description="Filter by booking ID"),
    guest_id: Optional[str] = Query(None, description="Filter by guest ID"),
    payment_status: Optional[str] = Query(
        None, description="Filter by payment status (Pending, Paid, Refunded)"
    ),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
):
    query = db.query(Invoice)
    if booking_id:
        query = query.filter(Invoice.booking_id == booking_id)
    if guest_id:
        query = query.filter(Invoice.guest_id == guest_id)
    if payment_status:
        query = query.filter(
            func.lower(Invoice.payment_status) == payment_status.lower()
        )

    invoices = query.order_by(Invoice.created_at.desc()).offset(skip).limit(limit).all()
    return [_format_invoice_response(inv) for inv in invoices]


@router.get("/{invoice_id}", response_model=InvoiceResponse)
def get_invoice(
    invoice_id: str,
    db: Session = Depends(get_db),
):
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Invoice with ID '{invoice_id}' not found",
        )
    return _format_invoice_response(invoice)


@router.post(
    "/{invoice_id}/items",
    response_model=InvoiceResponse,
    status_code=status.HTTP_201_CREATED,
)
def add_invoice_item(
    invoice_id: str,
    payload: InvoiceItemCreate,
    db: Session = Depends(get_db),
):
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Invoice with ID '{invoice_id}' not found",
        )

    if invoice.payment_status == "Paid":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot add items to an already paid invoice",
        )

    total_price = round(payload.unit_price * payload.quantity, 2)
    item = InvoiceItem(
        id=str(uuid.uuid4()),
        invoice_id=invoice.id,
        description=payload.description,
        item_type=payload.item_type,
        unit_price=payload.unit_price,
        quantity=payload.quantity,
        total_price=total_price,
    )
    db.add(item)
    db.flush()

    _recalculate_invoice_totals(invoice, db)
    return _format_invoice_response(invoice)


@router.post("/{invoice_id}/pay", response_model=InvoiceResponse)
def pay_invoice(
    invoice_id: str,
    payload: Optional[PaymentRequest] = None,
    db: Session = Depends(get_db),
):
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Invoice with ID '{invoice_id}' not found",
        )

    if invoice.payment_status == "Paid":
        return _format_invoice_response(invoice)

    method = payload.payment_method if payload else "CreditCard"
    invoice.payment_status = "Paid"
    invoice.payment_method = method
    invoice.paid_at = datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None)
    invoice.updated_at = datetime.datetime.now(datetime.timezone.utc).replace(
        tzinfo=None
    )

    db.commit()
    db.refresh(invoice)
    return _format_invoice_response(invoice)


@router.post("/{invoice_id}/refund", response_model=InvoiceResponse)
def refund_invoice(
    invoice_id: str,
    db: Session = Depends(get_db),
):
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Invoice with ID '{invoice_id}' not found",
        )

    if invoice.payment_status != "Paid":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only paid invoices can be refunded",
        )

    invoice.payment_status = "Refunded"
    invoice.updated_at = datetime.datetime.now(datetime.timezone.utc).replace(
        tzinfo=None
    )

    db.commit()
    db.refresh(invoice)
    return _format_invoice_response(invoice)
