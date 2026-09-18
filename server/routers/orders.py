import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from server.database import get_db
from server.models import Order, OrderItem, Flower
from server.schemas import OrderCreate, OrderStatusUpdate, OrderResponse

router = APIRouter(prefix="/api/v1/orders", tags=["Orders"])


@router.get("", response_model=List[OrderResponse])
def list_orders(
    status_filter: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    query = db.query(Order).options(
        joinedload(Order.order_items).joinedload(OrderItem.flower)
    )

    if status_filter:
        query = query.filter(Order.status == status_filter)
    if search:
        query = query.filter(
            Order.order_number.ilike(f"%{search}%")
            | Order.customer_name.ilike(f"%{search}%")
            | Order.customer_email.ilike(f"%{search}%")
        )

    orders = query.order_by(Order.created_at.desc()).offset(skip).limit(limit).all()
    return orders


@router.post("", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
def create_order(order_in: OrderCreate, db: Session = Depends(get_db)):
    if not order_in.items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Order must contain at least one item.",
        )

    # Validate flowers and stock
    items_to_create = []
    total_amount = 0.0

    for item in order_in.items:
        flower = db.query(Flower).filter(Flower.id == item.flower_id).first()
        if not flower:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Flower with ID '{item.flower_id}' not found.",
            )

        if flower.stock_quantity < item.quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient Stock for '{flower.name}'. Requested: {item.quantity}, Available: {flower.stock_quantity}.",
            )

        unit_price = (
            item.unit_price if item.unit_price is not None else flower.price_per_stem
        )
        line_total = item.quantity * unit_price
        total_amount += line_total

        # Deduct stock
        flower.stock_quantity -= item.quantity

        items_to_create.append(
            {
                "flower": flower,
                "flower_id": item.flower_id,
                "quantity": item.quantity,
                "unit_price": unit_price,
                "line_total": line_total,
            }
        )

    # Generate unique order_number
    unique_suffix = str(uuid.uuid4())[:8].upper()
    order_number = f"ORD-{unique_suffix}"

    order = Order(
        order_number=order_number,
        customer_name=order_in.customer_name,
        customer_email=order_in.customer_email,
        customer_phone=order_in.customer_phone,
        notes=order_in.notes,
        status="Pending",
        total_amount=round(total_amount, 2),
    )
    db.add(order)
    db.flush()

    for item_data in items_to_create:
        order_item = OrderItem(
            order_id=order.id,
            flower_id=item_data["flower_id"],
            quantity=item_data["quantity"],
            unit_price=item_data["unit_price"],
            line_total=round(item_data["line_total"], 2),
        )
        db.add(order_item)

    db.commit()

    # Re-query order with relationships
    created_order = (
        db.query(Order)
        .options(joinedload(Order.order_items).joinedload(OrderItem.flower))
        .filter(Order.id == order.id)
        .first()
    )

    return created_order


@router.get("/{id}", response_model=OrderResponse)
def get_order(id: str, db: Session = Depends(get_db)):
    order = (
        db.query(Order)
        .options(joinedload(Order.order_items).joinedload(OrderItem.flower))
        .filter(Order.id == id)
        .first()
    )

    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order with ID '{id}' not found.",
        )
    return order


@router.patch("/{id}/status", response_model=OrderResponse)
def update_order_status(
    id: str, status_in: OrderStatusUpdate, db: Session = Depends(get_db)
):
    order = (
        db.query(Order)
        .options(joinedload(Order.order_items).joinedload(OrderItem.flower))
        .filter(Order.id == id)
        .first()
    )

    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order with ID '{id}' not found.",
        )

    valid_statuses = ["Pending", "Processing", "Completed", "Cancelled"]
    new_status = status_in.status.capitalize()
    if new_status not in valid_statuses and status_in.status not in valid_statuses:
        # Accept exact string if valid
        if status_in.status in valid_statuses:
            new_status = status_in.status
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid status '{status_in.status}'. Valid statuses: {valid_statuses}.",
            )

    # If status changes to Cancelled from non-cancelled, restore stock
    if new_status == "Cancelled" and order.status != "Cancelled":
        for item in order.order_items:
            flower = db.query(Flower).filter(Flower.id == item.flower_id).first()
            if flower:
                flower.stock_quantity += item.quantity

    order.status = new_status
    db.commit()
    db.refresh(order)
    return order
