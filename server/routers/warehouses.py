import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

from server.database import get_db
from server.models.warehouse import Warehouse
from server.schemas.warehouse import WarehouseCreate, WarehouseResponse

router = APIRouter(prefix="/api/v1/warehouses", tags=["warehouses"])


@router.get("", response_model=List[WarehouseResponse])
def list_warehouses(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    warehouses = db.query(Warehouse).offset(skip).limit(limit).all()
    return warehouses


@router.post("", response_model=WarehouseResponse, status_code=status.HTTP_201_CREATED)
def create_warehouse(warehouse_in: WarehouseCreate, db: Session = Depends(get_db)):
    existing = db.query(Warehouse).filter(Warehouse.code == warehouse_in.code).first()
    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"Warehouse with code '{warehouse_in.code}' already exists.",
        )

    warehouse = Warehouse(
        id=str(uuid.uuid4()),
        code=warehouse_in.code,
        name=warehouse_in.name,
        location=warehouse_in.location,
    )
    db.add(warehouse)
    db.commit()
    db.refresh(warehouse)
    return warehouse


@router.get("/{warehouse_id}", response_model=WarehouseResponse)
def get_warehouse(warehouse_id: str, db: Session = Depends(get_db)):
    warehouse = (
        db.query(Warehouse)
        .filter(or_(Warehouse.id == warehouse_id, Warehouse.code == warehouse_id))
        .first()
    )
    if not warehouse:
        raise HTTPException(status_code=404, detail="Warehouse not found")
    return warehouse
