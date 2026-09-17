from typing import List
from fastapi import APIRouter, Depends, Path
from sqlalchemy.orm import Session
from server.database import get_db
from server.schemas import (
    ChipDefinitionCreate,
    ChipDefinitionResponse,
    ChipDefinitionUpdateStatus,
    InventoryBatchCreate,
    InventoryBatchResponse,
)
from server.services.inventory_service import (
    create_chip_definition,
    list_chip_definitions,
    get_chip_definition,
    add_inventory_batch,
    update_chip_status,
)

router = APIRouter(prefix="/api/v1/chips", tags=["Chips Inventory"])


@router.post("", response_model=ChipDefinitionResponse, status_code=201)
def create_chip(payload: ChipDefinitionCreate, db: Session = Depends(get_db)):
    return create_chip_definition(
        db, name=payload.name, category=payload.category, face_value=payload.face_value
    )


@router.get("", response_model=List[ChipDefinitionResponse])
def get_chips(db: Session = Depends(get_db)):
    return list_chip_definitions(db)


@router.get("/{chip_id}", response_model=ChipDefinitionResponse)
def get_chip(chip_id: str = Path(...), db: Session = Depends(get_db)):
    return get_chip_definition(db, chip_id)


@router.post(
    "/{chip_id}/batches", response_model=InventoryBatchResponse, status_code=201
)
def create_batch(
    payload: InventoryBatchCreate,
    chip_id: str = Path(...),
    db: Session = Depends(get_db),
):
    return add_inventory_batch(
        db,
        chip_id=chip_id,
        batch_number=payload.batch_number,
        total_quantity=payload.total_quantity,
    )


@router.patch("/{chip_id}/status", response_model=ChipDefinitionResponse)
def update_status(
    payload: ChipDefinitionUpdateStatus,
    chip_id: str = Path(...),
    db: Session = Depends(get_db),
):
    return update_chip_status(db, chip_id=chip_id, new_status=payload.status)
