from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from server.database import get_db
from server.models.warehouse import Warehouse
from server.schemas.warehouse import WarehouseCreate, WarehouseResponse

router = APIRouter(prefix="/warehouses", tags=["warehouses"])


@router.get("", response_model=List[WarehouseResponse])
def list_warehouses(db: Session = Depends(get_db)):
    return db.query(Warehouse).order_by(Warehouse.name.asc()).all()


@router.post("", response_model=WarehouseResponse, status_code=status.HTTP_201_CREATED)
def create_warehouse(wh_in: WarehouseCreate, db: Session = Depends(get_db)):
    existing = db.query(Warehouse).filter(Warehouse.code == wh_in.code).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Warehouse with code '{wh_in.code}' already exists",
        )

    wh = Warehouse(
        code=wh_in.code,
        name=wh_in.name,
        location=wh_in.location,
    )
    db.add(wh)
    db.commit()
    db.refresh(wh)
    return wh


@router.get("/{warehouse_id}", response_model=WarehouseResponse)
def get_warehouse(warehouse_id: str, db: Session = Depends(get_db)):
    wh = db.query(Warehouse).filter(Warehouse.id == warehouse_id).first()
    if not wh:
        wh = db.query(Warehouse).filter(Warehouse.code == warehouse_id).first()
    if not wh:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Warehouse not found",
        )
    return wh
