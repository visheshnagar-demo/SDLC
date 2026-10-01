"""Avatar customization and shop router."""

import uuid
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from server.app.database import get_db
from server.app import models, schemas

router = APIRouter(prefix="/api/v1/avatars", tags=["Avatars"])


@router.get("/catalog", response_model=List[schemas.AvatarItemResponse])
def get_avatar_catalog(
    child_id: Optional[str] = Query(None, description="Child profile UUID"),
    db: Session = Depends(get_db),
):
    all_items = db.query(models.AvatarItem).all()
    unlocked_map = {}
    equipped_map = {}

    if child_id:
        child_avatars = (
            db.query(models.ChildAvatar)
            .filter(models.ChildAvatar.child_id == child_id)
            .all()
        )
        for ca in child_avatars:
            unlocked_map[ca.avatar_item_id] = True
            equipped_map[ca.avatar_item_id] = ca.is_equipped

    results = []
    for item in all_items:
        results.append(
            schemas.AvatarItemResponse(
                id=item.id,
                item_name=item.item_name,
                category=item.category,
                cost_points=item.cost_points,
                asset_key=item.asset_key,
                is_unlocked=unlocked_map.get(item.id, False),
                is_equipped=equipped_map.get(item.id, False),
            )
        )
    return results


@router.post("/unlock", response_model=schemas.AvatarItemResponse)
def unlock_avatar_item(
    request: schemas.AvatarUnlockRequest,
    db: Session = Depends(get_db),
):
    child = db.query(models.Child).filter(models.Child.id == request.child_id).first()
    if not child:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Child profile with id {request.child_id} not found.",
        )

    item = (
        db.query(models.AvatarItem)
        .filter(models.AvatarItem.id == request.item_id)
        .first()
    )
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Avatar item with id {request.item_id} not found.",
        )

    existing = (
        db.query(models.ChildAvatar)
        .filter(
            models.ChildAvatar.child_id == child.id,
            models.ChildAvatar.avatar_item_id == item.id,
        )
        .first()
    )

    if existing:
        return schemas.AvatarItemResponse(
            id=item.id,
            item_name=item.item_name,
            category=item.category,
            cost_points=item.cost_points,
            asset_key=item.asset_key,
            is_unlocked=True,
            is_equipped=existing.is_equipped,
        )

    if child.total_points < item.cost_points:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Not enough points. Required: {item.cost_points}, Available: {child.total_points}",
        )

    child.total_points -= item.cost_points
    child_avatar = models.ChildAvatar(
        id=str(uuid.uuid4()),
        child_id=child.id,
        avatar_item_id=item.id,
        is_equipped=False,
        acquired_at=datetime.now(timezone.utc),
    )
    db.add(child_avatar)
    db.commit()

    return schemas.AvatarItemResponse(
        id=item.id,
        item_name=item.item_name,
        category=item.category,
        cost_points=item.cost_points,
        asset_key=item.asset_key,
        is_unlocked=True,
        is_equipped=False,
    )


@router.put("/equip", response_model=schemas.AvatarEquipResponse)
def equip_avatar_item(
    request: schemas.AvatarEquipRequest,
    db: Session = Depends(get_db),
):
    child = db.query(models.Child).filter(models.Child.id == request.child_id).first()
    if not child:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Child profile with id {request.child_id} not found.",
        )

    item = (
        db.query(models.AvatarItem)
        .filter(models.AvatarItem.id == request.item_id)
        .first()
    )
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Avatar item with id {request.item_id} not found.",
        )

    target_avatar = (
        db.query(models.ChildAvatar)
        .filter(
            models.ChildAvatar.child_id == child.id,
            models.ChildAvatar.avatar_item_id == item.id,
        )
        .first()
    )

    if not target_avatar:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Item must be unlocked before equipping.",
        )

    if request.is_equipped:
        # Unequip other items in the same category
        same_cat_items = (
            db.query(models.AvatarItem)
            .filter(models.AvatarItem.category == item.category)
            .all()
        )
        same_cat_ids = [i.id for i in same_cat_items]
        db.query(models.ChildAvatar).filter(
            models.ChildAvatar.child_id == child.id,
            models.ChildAvatar.avatar_item_id.in_(same_cat_ids),
        ).update({"is_equipped": False}, synchronize_session=False)

    target_avatar.is_equipped = request.is_equipped
    db.commit()

    # Get all currently equipped items for child
    equipped_records = (
        db.query(models.ChildAvatar)
        .join(models.AvatarItem)
        .filter(
            models.ChildAvatar.child_id == child.id,
            models.ChildAvatar.is_equipped == True,
        )
        .all()
    )

    equipped_list = [
        schemas.AvatarItemResponse(
            id=er.avatar_item.id,
            item_name=er.avatar_item.item_name,
            category=er.avatar_item.category,
            cost_points=er.avatar_item.cost_points,
            asset_key=er.avatar_item.asset_key,
            is_unlocked=True,
            is_equipped=True,
        )
        for er in equipped_records
    ]

    return schemas.AvatarEquipResponse(
        child_id=child.id,
        item_id=item.id,
        is_equipped=request.is_equipped,
        equipped_items=equipped_list,
    )
