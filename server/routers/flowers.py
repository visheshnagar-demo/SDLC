from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from server import crud, schemas
from server.database import get_db

router = APIRouter(prefix="/api/v1/flowers", tags=["Flowers"])


@router.get("", response_model=List[schemas.FlowerResponse])
def list_flowers(
    skip: int = 0,
    limit: int = 100,
    category_id: Optional[str] = None,
    supplier_id: Optional[str] = None,
    search: Optional[str] = None,
    low_stock_only: bool = False,
    db: Session = Depends(get_db),
):
    return crud.get_flowers(
        db,
        skip=skip,
        limit=limit,
        category_id=category_id,
        supplier_id=supplier_id,
        search=search,
        low_stock_only=low_stock_only,
    )


@router.get("/alerts/low-stock", response_model=List[schemas.StockAlert])
def get_low_stock_alerts(db: Session = Depends(get_db)):
    analytics = crud.get_dashboard_analytics(db)
    return analytics["stock_alerts"]


@router.post(
    "", response_model=schemas.FlowerResponse, status_code=status.HTTP_201_CREATED
)
def create_flower(flower_in: schemas.FlowerCreate, db: Session = Depends(get_db)):
    if flower_in.price_per_stem < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Price per stem cannot be negative",
        )
    if flower_in.stock_quantity < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Stock quantity cannot be negative",
        )
    try:
        return crud.create_flower(db, flower_in)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/{flower_id}", response_model=schemas.FlowerResponse)
def get_flower(flower_id: str, db: Session = Depends(get_db)):
    flower = crud.get_flower(db, flower_id)
    if not flower:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Flower with ID '{flower_id}' not found",
        )
    return flower


@router.put("/{flower_id}", response_model=schemas.FlowerResponse)
def update_flower(
    flower_id: str, flower_in: schemas.FlowerUpdate, db: Session = Depends(get_db)
):
    if flower_in.price_per_stem is not None and flower_in.price_per_stem < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Price per stem cannot be negative",
        )
    if flower_in.stock_quantity is not None and flower_in.stock_quantity < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Stock quantity cannot be negative",
        )
    try:
        flower = crud.update_flower(db, flower_id, flower_in)
        if not flower:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Flower with ID '{flower_id}' not found",
            )
        return flower
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.delete("/{flower_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_flower(flower_id: str, db: Session = Depends(get_db)):
    success = crud.delete_flower(db, flower_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Flower with ID '{flower_id}' not found",
        )
    return None
