from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from server.database import get_db
from server.models.item import Item
from server.schemas.item import ItemCreate, ItemUpdate, ItemResponse

router = APIRouter(prefix="/items", tags=["items"])


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
        query = query.filter(Item.category.ilike(f"%{category}%"))
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            Item.name.ilike(search_filter) | Item.sku.ilike(search_filter)
        )

    items = query.order_by(Item.created_at.desc()).offset(skip).limit(limit).all()
    return items


@router.post("", response_model=ItemResponse, status_code=status.HTTP_201_CREATED)
def create_item(item_in: ItemCreate, db: Session = Depends(get_db)):
    existing = db.query(Item).filter(Item.sku == item_in.sku).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Item with SKU '{item_in.sku}' already exists",
        )

    item = Item(
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
    return item


@router.get("/{item_id}", response_model=ItemResponse)
def get_item(item_id: str, db: Session = Depends(get_db)):
    item = db.query(Item).filter(Item.id == item_id).first()
    if not item:
        # Also try matching by SKU if item_id is a SKU
        item = db.query(Item).filter(Item.sku == item_id).first()
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item not found",
        )
    return item


@router.put("/{item_id}", response_model=ItemResponse)
def update_item(item_id: str, item_in: ItemUpdate, db: Session = Depends(get_db)):
    item = db.query(Item).filter(Item.id == item_id).first()
    if not item:
        item = db.query(Item).filter(Item.sku == item_id).first()
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item not found",
        )

    update_data = item_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(item, field, value)

    db.commit()
    db.refresh(item)
    return item


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_item(item_id: str, db: Session = Depends(get_db)):
    item = db.query(Item).filter(Item.id == item_id).first()
    if not item:
        item = db.query(Item).filter(Item.sku == item_id).first()
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item not found",
        )

    db.delete(item)
    db.commit()
    return None
