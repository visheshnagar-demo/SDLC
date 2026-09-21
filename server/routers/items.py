import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func, or_

from server.database import get_db
from server.models.item import Item
from server.models.inventory import InventoryStock
from server.schemas.item import ItemCreate, ItemUpdate, ItemResponse

router = APIRouter(prefix="/api/v1/items", tags=["items"])


@router.get("", response_model=List[ItemResponse])
def list_items(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    category: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = db.query(Item)
    if category:
        query = query.filter(Item.category == category)
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            or_(Item.name.ilike(search_filter), Item.sku.ilike(search_filter))
        )

    items = query.offset(skip).limit(limit).all()

    response = []
    for item in items:
        # Calculate total stock across all warehouses
        total = (
            db.query(func.coalesce(func.sum(InventoryStock.quantity_on_hand), 0))
            .filter(InventoryStock.item_id == item.id)
            .scalar()
        )

        item_dict = {
            "id": item.id,
            "sku": item.sku,
            "name": item.name,
            "category": item.category,
            "unit_price": item.unit_price,
            "reorder_threshold": item.reorder_threshold,
            "reorder_quantity": item.reorder_quantity,
            "created_at": item.created_at,
            "updated_at": item.updated_at,
            "total_stock": int(total or 0),
        }
        response.append(ItemResponse(**item_dict))

    return response


@router.post("", response_model=ItemResponse, status_code=status.HTTP_201_CREATED)
def create_item(item_in: ItemCreate, db: Session = Depends(get_db)):
    existing = db.query(Item).filter(Item.sku == item_in.sku).first()
    if existing:
        raise HTTPException(
            status_code=400, detail=f"Item with SKU '{item_in.sku}' already exists."
        )

    item = Item(
        id=str(uuid.uuid4()),
        sku=item_in.sku,
        name=item_in.name,
        category=item_in.category,
        unit_price=item_in.unit_price,
        reorder_threshold=item_in.reorder_threshold,
        reorder_quantity=item_in.reorder_quantity,
    )
    db.add(item)
    db.commit()
    db.refresh(item)

    return ItemResponse(
        id=item.id,
        sku=item.sku,
        name=item.name,
        category=item.category,
        unit_price=item.unit_price,
        reorder_threshold=item.reorder_threshold,
        reorder_quantity=item.reorder_quantity,
        created_at=item.created_at,
        updated_at=item.updated_at,
        total_stock=0,
    )


@router.get("/{item_id}", response_model=ItemResponse)
def get_item(item_id: str, db: Session = Depends(get_db)):
    item = db.query(Item).filter(or_(Item.id == item_id, Item.sku == item_id)).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    total = (
        db.query(func.coalesce(func.sum(InventoryStock.quantity_on_hand), 0))
        .filter(InventoryStock.item_id == item.id)
        .scalar()
    )

    return ItemResponse(
        id=item.id,
        sku=item.sku,
        name=item.name,
        category=item.category,
        unit_price=item.unit_price,
        reorder_threshold=item.reorder_threshold,
        reorder_quantity=item.reorder_quantity,
        created_at=item.created_at,
        updated_at=item.updated_at,
        total_stock=int(total or 0),
    )


@router.put("/{item_id}", response_model=ItemResponse)
def update_item(item_id: str, item_in: ItemUpdate, db: Session = Depends(get_db)):
    item = db.query(Item).filter(or_(Item.id == item_id, Item.sku == item_id)).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    if item_in.sku and item_in.sku != item.sku:
        existing = db.query(Item).filter(Item.sku == item_in.sku).first()
        if existing:
            raise HTTPException(
                status_code=400, detail=f"Item with SKU '{item_in.sku}' already exists."
            )
        item.sku = item_in.sku

    if item_in.name is not None:
        item.name = item_in.name
    if item_in.category is not None:
        item.category = item_in.category
    if item_in.unit_price is not None:
        item.unit_price = item_in.unit_price
    if item_in.reorder_threshold is not None:
        item.reorder_threshold = item_in.reorder_threshold
    if item_in.reorder_quantity is not None:
        item.reorder_quantity = item_in.reorder_quantity

    db.commit()
    db.refresh(item)

    total = (
        db.query(func.coalesce(func.sum(InventoryStock.quantity_on_hand), 0))
        .filter(InventoryStock.item_id == item.id)
        .scalar()
    )

    return ItemResponse(
        id=item.id,
        sku=item.sku,
        name=item.name,
        category=item.category,
        unit_price=item.unit_price,
        reorder_threshold=item.reorder_threshold,
        reorder_quantity=item.reorder_quantity,
        created_at=item.created_at,
        updated_at=item.updated_at,
        total_stock=int(total or 0),
    )


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_item(item_id: str, db: Session = Depends(get_db)):
    item = db.query(Item).filter(or_(Item.id == item_id, Item.sku == item_id)).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    db.delete(item)
    db.commit()
    return None
