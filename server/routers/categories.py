from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from server import crud, schemas
from server.database import get_db

router = APIRouter(prefix="/api/v1/categories", tags=["Categories"])


@router.get("", response_model=List[schemas.CategoryResponse])
def list_categories(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
):
    """List all flower categories."""
    return crud.get_categories(db, skip=skip, limit=limit)


@router.post(
    "", response_model=schemas.CategoryResponse, status_code=status.HTTP_201_CREATED
)
def create_category(category: schemas.CategoryCreate, db: Session = Depends(get_db)):
    """Add a new flower category."""
    return crud.create_category(db, category)


@router.get("/{id}", response_model=schemas.CategoryResponse)
def get_category(id: str, db: Session = Depends(get_db)):
    """Retrieve details for a specific category."""
    category = crud.get_category(db, id)
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Category with ID '{id}' not found.",
        )
    return category


@router.put("/{id}", response_model=schemas.CategoryResponse)
def update_category(
    id: str, category_update: schemas.CategoryUpdate, db: Session = Depends(get_db)
):
    """Update a flower category."""
    updated = crud.update_category(db, id, category_update)
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Category with ID '{id}' not found.",
        )
    return updated


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_category(id: str, db: Session = Depends(get_db)):
    """Remove a category."""
    success = crud.delete_category(db, id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Category with ID '{id}' not found.",
        )
    return None
