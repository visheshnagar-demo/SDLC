from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from server import crud, schemas
from server.database import get_db

router = APIRouter(prefix="/api/v1/flowers", tags=["Flowers"])


@router.get("", response_model=List[schemas.FlowerResponse])
def list_flowers(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    search: Optional[str] = None,
    category_id: Optional[str] = None,
    supplier_id: Optional[str] = None,
    low_stock_only: bool = False,
    db: Session = Depends(get_db),
):
    """List all flower records with optional filtering, search, and pagination."""
    return crud.get_flowers(
        db,
        skip=skip,
        limit=limit,
        search=search,
        category_id=category_id,
        supplier_id=supplier_id,
        low_stock_only=low_stock_only,
    )


@router.post(
    "", response_model=schemas.FlowerResponse, status_code=status.HTTP_201_CREATED
)
def create_flower(flower: schemas.FlowerCreate, db: Session = Depends(get_db)):
    """Create a new flower catalog record."""
    return crud.create_flower(db, flower)


@router.get("/{id}", response_model=schemas.FlowerResponse)
def get_flower(id: str, db: Session = Depends(get_db)):
    """Retrieve detailed information for a specific flower."""
    flower = crud.get_flower(db, id)
    if not flower:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Flower with ID '{id}' not found.",
        )
    return flower


@router.put("/{id}", response_model=schemas.FlowerResponse)
def update_flower(
    id: str, flower_update: schemas.FlowerUpdate, db: Session = Depends(get_db)
):
    """Update flower attributes including pricing, stock level, or freshness date."""
    updated = crud.update_flower(db, id, flower_update)
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Flower with ID '{id}' not found.",
        )
    return updated


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_flower(id: str, db: Session = Depends(get_db)):
    """Delete a flower catalog entry."""
    success = crud.delete_flower(db, id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Flower with ID '{id}' not found.",
        )
    return None
