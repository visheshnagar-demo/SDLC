from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from server import crud, schemas
from server.database import get_db

router = APIRouter(prefix="/api/v1/suppliers", tags=["Suppliers"])


@router.get("", response_model=List[schemas.SupplierResponse])
def list_suppliers(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
):
    """List all flower wholesale suppliers."""
    return crud.get_suppliers(db, skip=skip, limit=limit)


@router.post(
    "", response_model=schemas.SupplierResponse, status_code=status.HTTP_201_CREATED
)
def create_supplier(supplier: schemas.SupplierCreate, db: Session = Depends(get_db)):
    """Add a new flower supplier profile."""
    return crud.create_supplier(db, supplier)


@router.get("/{id}", response_model=schemas.SupplierResponse)
def get_supplier(id: str, db: Session = Depends(get_db)):
    """Get supplier details."""
    supplier = crud.get_supplier(db, id)
    if not supplier:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Supplier with ID '{id}' not found.",
        )
    return supplier


@router.put("/{id}", response_model=schemas.SupplierResponse)
def update_supplier(
    id: str, supplier_update: schemas.SupplierUpdate, db: Session = Depends(get_db)
):
    """Update supplier contact information."""
    updated = crud.update_supplier(db, id, supplier_update)
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Supplier with ID '{id}' not found.",
        )
    return updated


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_supplier(id: str, db: Session = Depends(get_db)):
    """Remove a supplier profile."""
    success = crud.delete_supplier(db, id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Supplier with ID '{id}' not found.",
        )
    return None
