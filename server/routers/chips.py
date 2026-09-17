from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from server.database import get_db
from server.models import InventoryBatch
from server.schemas import (
    ChipDefinitionCreate,
    ChipDefinitionResponse,
    ChipDefinitionStatusUpdate,
    InventoryBatchCreate,
    InventoryBatchResponse,
)
from server.services import inventory_service

router = APIRouter(prefix="/chips", tags=["Chips"])


@router.post("", response_model=ChipDefinitionResponse, status_code=201)
def create_chip(chip_in: ChipDefinitionCreate, db: Session = Depends(get_db)):
    chip = inventory_service.create_chip_definition(db, chip_in)
    return ChipDefinitionResponse(
        id=chip.id,
        name=chip.name,
        category=chip.category,
        face_value=chip.face_value,
        status=chip.status,
        created_at=chip.created_at,
        updated_at=chip.updated_at,
        total_stock=0,
        available_stock=0,
    )


@router.get("", response_model=List[ChipDefinitionResponse])
def list_chips(db: Session = Depends(get_db)):
    chips_summary = inventory_service.get_chips_with_summary(db)
    result = []
    for chip, total_stock, available_stock in chips_summary:
        result.append(
            ChipDefinitionResponse(
                id=chip.id,
                name=chip.name,
                category=chip.category,
                face_value=chip.face_value,
                status=chip.status,
                created_at=chip.created_at,
                updated_at=chip.updated_at,
                total_stock=total_stock,
                available_stock=available_stock,
            )
        )
    return result


@router.get("/{chip_id}")
def get_chip(chip_id: str, db: Session = Depends(get_db)):
    chip = inventory_service.get_chip_by_id(db, chip_id)
    if not chip:
        raise HTTPException(status_code=404, detail="Chip definition not found")

    batches = db.query(InventoryBatch).filter(InventoryBatch.chip_id == chip_id).all()
    total_stock = sum(b.total_quantity for b in batches)
    available_stock = sum(b.available_quantity for b in batches)

    return {
        "chip": ChipDefinitionResponse(
            id=chip.id,
            name=chip.name,
            category=chip.category,
            face_value=chip.face_value,
            status=chip.status,
            created_at=chip.created_at,
            updated_at=chip.updated_at,
            total_stock=total_stock,
            available_stock=available_stock,
        ),
        "batches": [InventoryBatchResponse.model_validate(b) for b in batches],
    }


@router.post(
    "/{chip_id}/batches", response_model=InventoryBatchResponse, status_code=201
)
def add_batch(
    chip_id: str, batch_in: InventoryBatchCreate, db: Session = Depends(get_db)
):
    batch = inventory_service.add_inventory_batch(db, chip_id, batch_in)
    return InventoryBatchResponse.model_validate(batch)


@router.patch("/{chip_id}/status", response_model=ChipDefinitionResponse)
def update_status(
    chip_id: str, status_in: ChipDefinitionStatusUpdate, db: Session = Depends(get_db)
):
    chip = inventory_service.update_chip_status(db, chip_id, status_in.status)
    batches = db.query(InventoryBatch).filter(InventoryBatch.chip_id == chip_id).all()
    total_stock = sum(b.total_quantity for b in batches)
    available_stock = sum(b.available_quantity for b in batches)

    return ChipDefinitionResponse(
        id=chip.id,
        name=chip.name,
        category=chip.category,
        face_value=chip.face_value,
        status=chip.status,
        created_at=chip.created_at,
        updated_at=chip.updated_at,
        total_stock=total_stock,
        available_stock=available_stock,
    )
