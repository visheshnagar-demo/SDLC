from datetime import datetime, timedelta, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from server.auth import get_current_active_user
from server.config import settings
from server.database import get_db
from server.models import CartItem, User, Watch
from server.schemas import (
    CartItemResponse,
    MessageResponse,
    ReserveRequest,
    ReserveResponse,
)

router = APIRouter(prefix="/cart", tags=["Vault Cart & Concurrency Reservation"])


def _calculate_seconds_remaining(expires_at: datetime) -> int:
    if not expires_at:
        return 0
    now_utc = datetime.now(timezone.utc)
    if expires_at.tzinfo is None:
        # SQLite returns naive UTC datetime
        diff = (expires_at - datetime.utcnow()).total_seconds()
    else:
        diff = (expires_at - now_utc).total_seconds()
    return max(0, int(diff))


@router.post(
    "/reserve",
    response_model=ReserveResponse,
    status_code=status.HTTP_200_OK,
    summary="Acquire or refresh 15-minute exclusive reservation hold on a 1-of-1 timepiece",
)
def reserve_watch(
    reserve_in: ReserveRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    watch = db.query(Watch).filter(Watch.id == reserve_in.watch_id).first()
    if not watch:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Timepiece with ID '{reserve_in.watch_id}' not found.",
        )

    if watch.status == "SOLD":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This timepiece has already been acquired and is no longer available.",
        )

    now_utc = datetime.now(timezone.utc)
    hold_duration = timedelta(minutes=settings.RESERVATION_HOLD_MINUTES)
    expires_at = now_utc + hold_duration

    # Check if currently reserved by another buyer
    if watch.status == "RESERVED" and watch.reserved_by_user_id != current_user.id:
        if watch.hold_expires_at:
            watch_exp = watch.hold_expires_at
            if watch_exp.tzinfo is None:
                is_active_hold = watch_exp > datetime.utcnow()
            else:
                is_active_hold = watch_exp > now_utc

            if is_active_hold:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="This 1-of-1 timepiece is currently held in checkout by another collector. Concurrency lock active.",
                )

    # Acquire or refresh hold
    watch.status = "RESERVED"
    watch.reserved_by_user_id = current_user.id
    watch.hold_expires_at = expires_at

    cart_item = (
        db.query(CartItem)
        .filter(CartItem.user_id == current_user.id, CartItem.watch_id == watch.id)
        .first()
    )

    if not cart_item:
        cart_item = CartItem(
            user_id=current_user.id, watch_id=watch.id, expires_at=expires_at
        )
        db.add(cart_item)
    else:
        cart_item.expires_at = expires_at

    db.commit()
    db.refresh(watch)
    db.refresh(cart_item)

    seconds_rem = _calculate_seconds_remaining(cart_item.expires_at)

    return {
        "id": cart_item.id,
        "user_id": cart_item.user_id,
        "watch_id": cart_item.watch_id,
        "status": watch.status,
        "reserved_at": cart_item.reserved_at,
        "expires_at": cart_item.expires_at,
        "seconds_remaining": seconds_rem,
        "watch": watch,
    }


@router.delete(
    "/reserve/{watch_id}",
    response_model=MessageResponse,
    status_code=status.HTTP_200_OK,
    summary="Release 15-minute reservation hold and return timepiece to catalog",
)
def release_reservation(
    watch_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    watch = db.query(Watch).filter(Watch.id == watch_id).first()
    if not watch:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Timepiece with ID '{watch_id}' not found.",
        )

    # Only owner of reservation or admin can release
    if watch.reserved_by_user_id == current_user.id or current_user.role == "admin":
        if watch.status == "RESERVED":
            watch.status = "AVAILABLE"
            watch.reserved_by_user_id = None
            watch.hold_expires_at = None

    db.query(CartItem).filter(
        CartItem.user_id == current_user.id, CartItem.watch_id == watch_id
    ).delete()

    db.commit()
    return {"detail": "Timepiece reservation hold released successfully."}


@router.get(
    "",
    response_model=List[CartItemResponse],
    status_code=status.HTTP_200_OK,
    summary="Get active cart items and active reservation countdowns",
)
def get_cart(
    current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)
):
    now_utc = datetime.now(timezone.utc)
    cart_items = db.query(CartItem).filter(CartItem.user_id == current_user.id).all()

    active_items = []
    for item in cart_items:
        exp = item.expires_at
        if exp.tzinfo is None:
            is_valid = exp > datetime.utcnow()
        else:
            is_valid = exp > now_utc

        if not is_valid:
            # Expired, clean up
            if (
                item.watch
                and item.watch.status == "RESERVED"
                and item.watch.reserved_by_user_id == current_user.id
            ):
                item.watch.status = "AVAILABLE"
                item.watch.reserved_by_user_id = None
                item.watch.hold_expires_at = None
            db.delete(item)
        else:
            active_items.append(
                {
                    "id": item.id,
                    "user_id": item.user_id,
                    "watch_id": item.watch_id,
                    "reserved_at": item.reserved_at,
                    "expires_at": item.expires_at,
                    "seconds_remaining": _calculate_seconds_remaining(item.expires_at),
                    "watch": item.watch,
                }
            )
    db.commit()
    return active_items
