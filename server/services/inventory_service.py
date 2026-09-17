import uuid
from typing import List, Tuple, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException
from server.models import ChipDefinition, InventoryBatch
from server.schemas import ChipDefinitionCreate, InventoryBatchCreate
from server.services.audit_service import create_audit_log


def create_chip_definition(
    db: Session, chip_in: ChipDefinitionCreate, actor_id: Optional[str] = None
) -> ChipDefinition:
    chip = ChipDefinition(
        id=str(uuid.uuid4()),
        name=chip_in.name,
        category=chip_in.category,
        face_value=chip_in.face_value,
        status=chip_in.status,
    )
    db.add(chip)
    db.flush()

    create_audit_log(
        db,
        action_type="CHIP_CREATE",
        entity_name="ChipDefinition",
        entity_id=chip.id,
        actor_id=actor_id,
        after_state={
            "name": chip.name,
            "category": chip.category,
            "face_value": chip.face_value,
            "status": chip.status,
        },
    )
    db.commit()
    db.refresh(chip)
    return chip


def get_chips_with_summary(db: Session) -> List[Tuple[ChipDefinition, int, int]]:
    chips = db.query(ChipDefinition).all()
    result = []
    for chip in chips:
        batches = (
            db.query(InventoryBatch).filter(InventoryBatch.chip_id == chip.id).all()
        )
        total_stock = sum(b.total_quantity for b in batches)
        available_stock = sum(b.available_quantity for b in batches)
        result.append((chip, total_stock, available_stock))
    return result


def get_chip_by_id(db: Session, chip_id: str) -> Optional[ChipDefinition]:
    return db.query(ChipDefinition).filter(ChipDefinition.id == chip_id).first()


def add_inventory_batch(
    db: Session,
    chip_id: str,
    batch_in: InventoryBatchCreate,
    actor_id: Optional[str] = None,
) -> InventoryBatch:
    chip = get_chip_by_id(db, chip_id)
    if not chip:
        raise HTTPException(status_code=404, detail="Chip definition not found")

    existing_batch = (
        db.query(InventoryBatch)
        .filter(InventoryBatch.batch_number == batch_in.batch_number)
        .first()
    )
    if existing_batch:
        raise HTTPException(
            status_code=400,
            detail=f"Batch number {batch_in.batch_number} already exists",
        )

    batch = InventoryBatch(
        id=str(uuid.uuid4()),
        chip_id=chip_id,
        batch_number=batch_in.batch_number,
        total_quantity=batch_in.total_quantity,
        available_quantity=batch_in.total_quantity,
        allocated_quantity=0,
        status=batch_in.status,
    )
    db.add(batch)
    db.flush()

    create_audit_log(
        db,
        action_type="BATCH_ADD",
        entity_name="InventoryBatch",
        entity_id=batch.id,
        actor_id=actor_id,
        after_state={
            "chip_id": chip_id,
            "batch_number": batch.batch_number,
            "total_quantity": batch.total_quantity,
        },
    )
    db.commit()
    db.refresh(batch)
    return batch


def update_chip_status(
    db: Session, chip_id: str, status: str, actor_id: Optional[str] = None
) -> ChipDefinition:
    chip = get_chip_by_id(db, chip_id)
    if not chip:
        raise HTTPException(status_code=404, detail="Chip definition not found")

    before_state = {"status": chip.status}
    chip.status = status
    db.flush()

    create_audit_log(
        db,
        action_type="CHIP_STATUS_UPDATE",
        entity_name="ChipDefinition",
        entity_id=chip.id,
        actor_id=actor_id,
        before_state=before_state,
        after_state={"status": chip.status},
    )
    db.commit()
    db.refresh(chip)
    return chip
