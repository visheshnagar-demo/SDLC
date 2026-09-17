from typing import List
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from server.models import ChipDefinition, InventoryBatch, AuditLog


def create_chip_definition(
    db: Session, name: str, category: str, face_value: float, actor_id: str = "system"
) -> ChipDefinition:
    existing = db.query(ChipDefinition).filter(ChipDefinition.name == name).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Chip definition with name '{name}' already exists.",
        )

    chip = ChipDefinition(
        name=name, category=category, face_value=face_value, status="ACTIVE"
    )
    db.add(chip)
    db.flush()

    audit = AuditLog(
        actor_id=actor_id,
        action_type="CHIP_CREATED",
        entity_name="chip_definitions",
        entity_id=chip.id,
        before_state=None,
        after_state={
            "id": chip.id,
            "name": chip.name,
            "category": chip.category,
            "face_value": chip.face_value,
            "status": chip.status,
        },
    )
    db.add(audit)
    db.commit()
    db.refresh(chip)
    return chip


def list_chip_definitions(db: Session) -> List[ChipDefinition]:
    chips = db.query(ChipDefinition).all()
    for chip in chips:
        total_qty = sum(b.total_quantity for b in chip.batches)
        avail_qty = sum(b.available_quantity for b in chip.batches)
        alloc_qty = sum(b.allocated_quantity for b in chip.batches)
        setattr(chip, "total_quantity", total_qty)
        setattr(chip, "available_quantity", avail_qty)
        setattr(chip, "allocated_quantity", alloc_qty)
    return chips


def get_chip_definition(db: Session, chip_id: str) -> ChipDefinition:
    chip = db.query(ChipDefinition).filter(ChipDefinition.id == chip_id).first()
    if not chip:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Chip definition '{chip_id}' not found.",
        )
    total_qty = sum(b.total_quantity for b in chip.batches)
    avail_qty = sum(b.available_quantity for b in chip.batches)
    alloc_qty = sum(b.allocated_quantity for b in chip.batches)
    setattr(chip, "total_quantity", total_qty)
    setattr(chip, "available_quantity", avail_qty)
    setattr(chip, "allocated_quantity", alloc_qty)
    return chip


def add_inventory_batch(
    db: Session,
    chip_id: str,
    batch_number: str,
    total_quantity: int,
    actor_id: str = "system",
) -> InventoryBatch:
    chip = get_chip_definition(db, chip_id)

    existing_batch = (
        db.query(InventoryBatch)
        .filter(InventoryBatch.batch_number == batch_number)
        .first()
    )
    if existing_batch:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Inventory batch '{batch_number}' already exists.",
        )

    batch = InventoryBatch(
        chip_id=chip.id,
        batch_number=batch_number,
        total_quantity=total_quantity,
        available_quantity=total_quantity,
        allocated_quantity=0,
        status="AVAILABLE",
    )
    db.add(batch)
    db.flush()

    audit = AuditLog(
        actor_id=actor_id,
        action_type="BATCH_ADDED",
        entity_name="inventory_batches",
        entity_id=batch.id,
        before_state=None,
        after_state={
            "id": batch.id,
            "chip_id": chip.id,
            "batch_number": batch_number,
            "total_quantity": total_quantity,
            "available_quantity": total_quantity,
        },
    )
    db.add(audit)
    db.commit()
    db.refresh(batch)
    return batch


def update_chip_status(
    db: Session, chip_id: str, new_status: str, actor_id: str = "system"
) -> ChipDefinition:
    chip = get_chip_definition(db, chip_id)
    before_status = chip.status

    chip.status = new_status

    audit = AuditLog(
        actor_id=actor_id,
        action_type="CHIP_STATUS_UPDATED",
        entity_name="chip_definitions",
        entity_id=chip.id,
        before_state={"status": before_status},
        after_state={"status": new_status},
    )
    db.add(audit)
    db.commit()
    db.refresh(chip)

    total_qty = sum(b.total_quantity for b in chip.batches)
    avail_qty = sum(b.available_quantity for b in chip.batches)
    alloc_qty = sum(b.allocated_quantity for b in chip.batches)
    setattr(chip, "total_quantity", total_qty)
    setattr(chip, "available_quantity", avail_qty)
    setattr(chip, "allocated_quantity", alloc_qty)
    return chip
