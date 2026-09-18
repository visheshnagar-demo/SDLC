from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from server.database import get_db
from server.models import Flower, Category, Supplier
from server.schemas import FlowerCreate, FlowerUpdate, FlowerResponse

router = APIRouter(prefix="/api/v1/flowers", tags=["Flowers"])


@router.get("", response_model=List[FlowerResponse])
def list_flowers(
    category_id: Optional[str] = None,
    supplier_id: Optional[str] = None,
    search: Optional[str] = None,
    low_stock_only: Optional[bool] = False,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    query = db.query(Flower).options(
        joinedload(Flower.category), joinedload(Flower.supplier)
    )

    if category_id:
        query = query.filter(Flower.category_id == category_id)
    if supplier_id:
        query = query.filter(Flower.supplier_id == supplier_id)
    if search:
        query = query.filter(
            Flower.name.ilike(f"%{search}%")
            | Flower.species.ilike(f"%{search}%")
            | Flower.color.ilike(f"%{search}%")
        )
    if low_stock_only:
        # Stock quantity <= low_stock_threshold and low_stock_threshold > 0
        query = query.filter(
            Flower.low_stock_threshold > 0,
            Flower.stock_quantity <= Flower.low_stock_threshold,
        )

    flowers = query.offset(skip).limit(limit).all()
    return flowers


@router.post("", response_model=FlowerResponse, status_code=status.HTTP_201_CREATED)
def create_flower(flower_in: FlowerCreate, db: Session = Depends(get_db)):
    if flower_in.price_per_stem < 0 or flower_in.stock_quantity < 0:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Price per stem and stock quantity must be non-negative.",
        )

    if flower_in.category_id:
        cat = db.query(Category).filter(Category.id == flower_in.category_id).first()
        if not cat:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Category ID '{flower_in.category_id}' does not exist.",
            )

    if flower_in.supplier_id:
        sup = db.query(Supplier).filter(Supplier.id == flower_in.supplier_id).first()
        if not sup:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Supplier ID '{flower_in.supplier_id}' does not exist.",
            )

    flower = Flower(**flower_in.model_dump())
    db.add(flower)
    db.commit()
    db.refresh(flower)
    return flower


@router.get("/{id}", response_model=FlowerResponse)
def get_flower(id: str, db: Session = Depends(get_db)):
    flower = (
        db.query(Flower)
        .options(joinedload(Flower.category), joinedload(Flower.supplier))
        .filter(Flower.id == id)
        .first()
    )
    if not flower:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Flower with ID '{id}' not found.",
        )
    return flower


@router.put("/{id}", response_model=FlowerResponse)
def update_flower(id: str, flower_in: FlowerUpdate, db: Session = Depends(get_db)):
    flower = db.query(Flower).filter(Flower.id == id).first()
    if not flower:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Flower with ID '{id}' not found.",
        )

    update_data = flower_in.model_dump(exclude_unset=True)

    if (
        "price_per_stem" in update_data
        and update_data["price_per_stem"] is not None
        and update_data["price_per_stem"] < 0
    ):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Price per stem must be non-negative.",
        )
    if (
        "stock_quantity" in update_data
        and update_data["stock_quantity"] is not None
        and update_data["stock_quantity"] < 0
    ):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Stock quantity must be non-negative.",
        )

    if update_data.get("category_id"):
        cat = (
            db.query(Category).filter(Category.id == update_data["category_id"]).first()
        )
        if not cat:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Category ID '{update_data['category_id']}' does not exist.",
            )

    if update_data.get("supplier_id"):
        sup = (
            db.query(Supplier).filter(Supplier.id == update_data["supplier_id"]).first()
        )
        if not sup:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Supplier ID '{update_data['supplier_id']}' does not exist.",
            )

    for field, value in update_data.items():
        setattr(flower, field, value)

    db.commit()
    db.refresh(flower)
    # Reload relationships
    db.refresh(flower)
    return flower


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_flower(id: str, db: Session = Depends(get_db)):
    flower = db.query(Flower).filter(Flower.id == id).first()
    if not flower:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Flower with ID '{id}' not found.",
        )
    db.delete(flower)
    db.commit()
    return None
