import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from server.database import get_db
from server import models, schemas

router = APIRouter(prefix="/api/v1/inventory", tags=["Inventory & Assets"])


@router.get("/items", response_model=List[schemas.InventoryItemResponse])
def list_inventory_items(
    category: Optional[str] = Query(None), db: Session = Depends(get_db)
):
    query = db.query(models.InventoryItem)
    if category:
        query = query.filter(models.InventoryItem.category == category)
    return query.all()


@router.post(
    "/items",
    response_model=schemas.InventoryItemResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_inventory_item(
    item_in: schemas.InventoryItemCreate, db: Session = Depends(get_db)
):
    existing = (
        db.query(models.InventoryItem)
        .filter(models.InventoryItem.item_code == item_in.item_code)
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="Item code already exists")

    item = models.InventoryItem(
        id=str(uuid.uuid4()),
        item_code=item_in.item_code,
        item_name=item_in.item_name,
        category=item_in.category,
        unit_of_measure=item_in.unit_of_measure,
        current_stock=item_in.current_stock,
        minimum_threshold=item_in.minimum_threshold,
        is_precious_asset=item_in.is_precious_asset,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.post(
    "/movements",
    response_model=schemas.InventoryMovementResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_inventory_movement(
    movement_in: schemas.InventoryMovementCreate, db: Session = Depends(get_db)
):
    item = (
        db.query(models.InventoryItem)
        .filter(models.InventoryItem.id == movement_in.item_id)
        .first()
    )
    if not item:
        item = (
            db.query(models.InventoryItem)
            .filter(models.InventoryItem.item_code == movement_in.item_id)
            .first()
        )
    if not item:
        raise HTTPException(status_code=404, detail="Inventory item not found")

    if movement_in.movement_type == "in":
        item.current_stock += movement_in.quantity
    elif movement_in.movement_type == "out":
        if item.current_stock < movement_in.quantity:
            raise HTTPException(status_code=400, detail="Insufficient stock available")
        item.current_stock -= movement_in.quantity
    elif movement_in.movement_type == "audit":
        item.current_stock = movement_in.quantity

    movement = models.InventoryMovement(
        id=str(uuid.uuid4()),
        item_id=item.id,
        movement_type=movement_in.movement_type,
        quantity=movement_in.quantity,
        unit_price=movement_in.unit_price,
        reference_reason=movement_in.reference_reason,
    )
    db.add(movement)
    db.commit()
    db.refresh(movement)
    return movement


@router.get("/alerts", response_model=List[schemas.InventoryItemResponse])
def get_low_stock_alerts(db: Session = Depends(get_db)):
    return (
        db.query(models.InventoryItem)
        .filter(
            models.InventoryItem.current_stock <= models.InventoryItem.minimum_threshold
        )
        .all()
    )
