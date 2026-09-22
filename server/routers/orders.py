import random
import string
from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from server.auth import get_current_active_user, require_admin
from server.database import get_db
from server.models import CartItem, Order, User, UserAddress, Watch
from server.schemas import CheckoutRequest, OrderResponse, OrderStatusUpdateRequest

router = APIRouter(prefix="/orders", tags=["Order Lifecycle & Courier Tracking"])


def _generate_order_number() -> str:
    digits = "".join(random.choices(string.digits, k=5))
    return f"ORD-{digits}-CH"


def _generate_handover_pin() -> str:
    return "".join(random.choices(string.digits, k=4))


def _generate_tracking_number(carrier: str) -> str:
    if "Ferrari" in carrier:
        return f"FG-{random.randint(100, 999)}"
    return f"MA-{random.randint(1000, 9999)}-SEC"


@router.post(
    "/checkout",
    response_model=OrderResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Complete luxury timepiece escrow acquisition and generate courier dispatch order",
)
def checkout(
    checkout_in: CheckoutRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    watch = db.query(Watch).filter(Watch.id == checkout_in.watch_id).first()
    if not watch:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Timepiece with ID '{checkout_in.watch_id}' not found.",
        )

    if watch.status == "SOLD":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This timepiece has already been acquired by another collector.",
        )

    # If reserved, must belong to current user and not be expired
    now_utc = datetime.now(timezone.utc)
    if watch.status == "RESERVED":
        if watch.reserved_by_user_id and watch.reserved_by_user_id != current_user.id:
            watch_exp = watch.hold_expires_at
            if watch_exp:
                if watch_exp.tzinfo is None:
                    is_active = watch_exp > datetime.utcnow()
                else:
                    is_active = watch_exp > now_utc
                if is_active:
                    raise HTTPException(
                        status_code=status.HTTP_409_CONFLICT,
                        detail="This timepiece is currently held by another buyer.",
                    )

    # Resolve shipping address
    shipping_address_id = checkout_in.shipping_address_id
    if checkout_in.shipping_address:
        new_addr = UserAddress(
            user_id=current_user.id,
            street_address=checkout_in.shipping_address.street_address,
            city=checkout_in.shipping_address.city,
            state=checkout_in.shipping_address.state,
            postal_code=checkout_in.shipping_address.postal_code,
            country=checkout_in.shipping_address.country,
            is_default=False,
        )
        db.add(new_addr)
        db.flush()
        shipping_address_id = new_addr.id
    elif not shipping_address_id:
        # Try default address
        default_addr = (
            db.query(UserAddress)
            .filter(
                UserAddress.user_id == current_user.id, UserAddress.is_default == True
            )
            .first()
        )
        if default_addr:
            shipping_address_id = default_addr.id

    # Calculate shipping fee
    shipping_fee = 0.0
    if "Ferrari" in checkout_in.shipping_tier or "Express" in checkout_in.shipping_tier:
        shipping_fee = 150.0
        courier_name = "Ferrari Group Armored Logistics"
    else:
        courier_name = "Malca-Amit Priority Secure"

    total_amount = float(watch.price) + shipping_fee

    order = Order(
        order_number=_generate_order_number(),
        user_id=current_user.id,
        watch_id=watch.id,
        total_amount=total_amount,
        shipping_fee=shipping_fee,
        shipping_tier=checkout_in.shipping_tier,
        shipping_address_id=shipping_address_id,
        payment_status="PAID",
        fulfillment_status="PENDING_VERIFICATION",
        courier_name=courier_name,
        tracking_number=_generate_tracking_number(courier_name),
        handover_pin=_generate_handover_pin(),
        certificate_url=f"/certificates/{watch.certificate_number}.pdf",
    )
    db.add(order)

    # Mark watch as SOLD and clear reservations
    watch.status = "SOLD"
    watch.reserved_by_user_id = None
    watch.hold_expires_at = None

    db.query(CartItem).filter(
        CartItem.user_id == current_user.id, CartItem.watch_id == watch.id
    ).delete()

    db.commit()
    db.refresh(order)
    return order


@router.get(
    "",
    response_model=List[OrderResponse],
    status_code=status.HTTP_200_OK,
    summary="List authenticated customer orders with courier tracking",
)
def list_orders(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    query = db.query(Order)
    if current_user.role != "admin":
        query = query.filter(Order.user_id == current_user.id)

    orders = query.order_by(Order.created_at.desc()).offset(skip).limit(limit).all()
    return orders


@router.get(
    "/{order_id}",
    response_model=OrderResponse,
    status_code=status.HTTP_200_OK,
    summary="Get detailed order receipt, tracking milestone, and authenticity certificates",
)
def get_order_by_id(
    order_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        # Check by order_number as fallback
        order = db.query(Order).filter(Order.order_number == order_id).first()

    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order '{order_id}' not found.",
        )

    if current_user.role != "admin" and order.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Access denied to this order."
        )

    return order


@router.patch(
    "/{order_id}/status",
    response_model=OrderResponse,
    status_code=status.HTTP_200_OK,
    summary="Advance order fulfillment status or update courier tracking (Admin only)",
)
def update_order_status(
    order_id: str,
    status_in: OrderStatusUpdateRequest,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        order = db.query(Order).filter(Order.order_number == order_id).first()

    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order '{order_id}' not found.",
        )

    if status_in.fulfillment_status:
        order.fulfillment_status = status_in.fulfillment_status
    if status_in.payment_status:
        order.payment_status = status_in.payment_status
    if status_in.tracking_number:
        order.tracking_number = status_in.tracking_number
    if status_in.courier_name:
        order.courier_name = status_in.courier_name

    db.commit()
    db.refresh(order)
    return order
