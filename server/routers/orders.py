from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from server import crud, schemas
from server.database import get_db

router = APIRouter(prefix="/api/v1/orders", tags=["Orders"])


@router.get("", response_model=List[schemas.OrderResponse])
def list_orders(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    status_filter: Optional[str] = Query(None, alias="status"),
    db: Session = Depends(get_db),
):
    """List all orders with status filtering and pagination."""
    return crud.get_orders(db, skip=skip, limit=limit, status_filter=status_filter)


@router.post(
    "", response_model=schemas.OrderResponse, status_code=status.HTTP_201_CREATED
)
def place_order(order_data: schemas.OrderCreate, db: Session = Depends(get_db)):
    """Place a new customer/staff order with atomic inventory deduction."""
    return crud.create_order(db, order_data)


@router.get("/{id}", response_model=schemas.OrderResponse)
def get_order(id: str, db: Session = Depends(get_db)):
    """Retrieve order details including line items and total amounts."""
    order = crud.get_order(db, id)
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order with ID '{id}' not found.",
        )
    return order


@router.patch("/{id}/status", response_model=schemas.OrderResponse)
def update_order_status(
    id: str, status_update: schemas.OrderStatusUpdate, db: Session = Depends(get_db)
):
    """Update order status (Pending, Processing, Completed, Cancelled)."""
    updated = crud.update_order_status(db, id, status_update.status)
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order with ID '{id}' not found.",
        )
    return updated
