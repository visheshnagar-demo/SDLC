from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from server.auth import get_current_active_user
from server.database import get_db
from server.models import User, Watch, WishlistItem
from server.schemas import WishlistItemResponse, WishlistToggleResponse

router = APIRouter(prefix="/wishlist", tags=["Customer Wishlist & Saved Pieces"])


@router.get(
    "",
    response_model=List[WishlistItemResponse],
    status_code=status.HTTP_200_OK,
    summary="Get saved luxury timepieces for authenticated customer",
)
def get_wishlist(
    current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)
):
    items = (
        db.query(WishlistItem)
        .filter(WishlistItem.user_id == current_user.id)
        .order_by(WishlistItem.created_at.desc())
        .all()
    )
    return items


@router.post(
    "/{watch_id}",
    response_model=WishlistToggleResponse,
    status_code=status.HTTP_200_OK,
    summary="Toggle a timepiece in customer's wishlist",
)
def toggle_wishlist(
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

    existing = (
        db.query(WishlistItem)
        .filter(
            WishlistItem.user_id == current_user.id, WishlistItem.watch_id == watch_id
        )
        .first()
    )

    if existing:
        db.delete(existing)
        db.commit()
        return {
            "in_wishlist": False,
            "watch_id": watch_id,
            "message": f"'{watch.brand} {watch.model}' removed from your wishlist.",
        }
    else:
        new_item = WishlistItem(user_id=current_user.id, watch_id=watch_id)
        db.add(new_item)
        db.commit()
        return {
            "in_wishlist": True,
            "watch_id": watch_id,
            "message": f"'{watch.brand} {watch.model}' added to your wishlist.",
        }


@router.delete(
    "/{watch_id}",
    response_model=WishlistToggleResponse,
    status_code=status.HTTP_200_OK,
    summary="Remove a timepiece from customer's wishlist",
)
def remove_from_wishlist(
    watch_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    existing = (
        db.query(WishlistItem)
        .filter(
            WishlistItem.user_id == current_user.id, WishlistItem.watch_id == watch_id
        )
        .first()
    )

    if existing:
        db.delete(existing)
        db.commit()

    return {
        "in_wishlist": False,
        "watch_id": watch_id,
        "message": "Removed from wishlist.",
    }
