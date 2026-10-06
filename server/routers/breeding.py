from datetime import datetime, timedelta, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from server.database import get_db
from server.models import Cattle, BreedingRecord
from server.schemas import (
    BreedingRecordCreate,
    BreedingRecordUpdate,
    BreedingRecordOut,
)

router = APIRouter(
    prefix="/api/v1/breeding-records", tags=["Breeding & Gestation Engine"]
)


@router.get("", response_model=List[BreedingRecordOut])
def list_breeding_records(
    cow_id: Optional[str] = Query(None),
    stage: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=500),
    db: Session = Depends(get_db),
):
    """Retrieve reproductive lifecycle and breeding records with optional filters."""
    query = db.query(BreedingRecord)
    if cow_id:
        query = query.filter(BreedingRecord.cow_id == cow_id)
    if stage:
        query = query.filter(BreedingRecord.stage.ilike(stage))

    return (
        query.order_by(
            BreedingRecord.event_date.desc(), BreedingRecord.created_at.desc()
        )
        .offset(skip)
        .limit(limit)
        .all()
    )


@router.post("", response_model=BreedingRecordOut, status_code=status.HTTP_201_CREATED)
def create_breeding_record(
    payload: BreedingRecordCreate, db: Session = Depends(get_db)
):
    """Record a new breeding event with automated 283-day gestation calculation and cycle reset handling."""
    cow = db.query(Cattle).filter(Cattle.id == payload.cow_id).first()
    if not cow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Cattle with ID '{payload.cow_id}' not found",
        )

    gestation_check_due_date = None
    expected_calving_date = None
    insem_date = payload.insemination_date

    normalized_stage = payload.stage.strip().title()

    if normalized_stage == "Inseminated":
        insem_date = insem_date or payload.event_date
        gestation_check_due_date = insem_date + timedelta(days=44)
        expected_calving_date = insem_date + timedelta(days=283)
        cow.status = "Inseminated"

    elif normalized_stage == "Confirmed Pregnant":
        cow.status = "Pregnant"
        # If insem_date provided or exists on latest record, calculate calving date
        if insem_date:
            expected_calving_date = insem_date + timedelta(days=283)
        else:
            latest_insem = (
                db.query(BreedingRecord)
                .filter(
                    BreedingRecord.cow_id == payload.cow_id,
                    BreedingRecord.stage == "Inseminated",
                )
                .order_by(BreedingRecord.event_date.desc())
                .first()
            )
            if latest_insem and latest_insem.insemination_date:
                insem_date = latest_insem.insemination_date
                expected_calving_date = insem_date + timedelta(days=283)

    elif normalized_stage == "Dry Period":
        cow.status = "Dry"

    elif normalized_stage == "Calved":
        cow.status = "Lactating"

    elif normalized_stage in ("In Heat", "Failed Conception"):
        # Check if previous active cycle existed
        latest_record = (
            db.query(BreedingRecord)
            .filter(BreedingRecord.cow_id == payload.cow_id)
            .order_by(BreedingRecord.event_date.desc())
            .first()
        )
        if latest_record and latest_record.stage in (
            "Inseminated",
            "Confirmed Pregnant",
        ):
            # Reset breeding cycle and flag failed conception
            latest_record.notes = (
                latest_record.notes or ""
            ) + " [Cycle Reset: Failed Conception]"
            cow.status = "Active"
        else:
            cow.status = "Active"

    new_record = BreedingRecord(
        cow_id=payload.cow_id,
        stage=normalized_stage,
        event_date=payload.event_date,
        insemination_date=insem_date,
        sire_rfid_or_code=payload.sire_rfid_or_code,
        gestation_check_due_date=gestation_check_due_date,
        expected_calving_date=expected_calving_date,
        notes=payload.notes,
    )
    cow.updated_at = datetime.now(timezone.utc)
    db.add(new_record)
    db.commit()
    db.refresh(new_record)
    return new_record


@router.get("/{record_id}", response_model=BreedingRecordOut)
def get_breeding_record(record_id: str, db: Session = Depends(get_db)):
    """Retrieve details of a specific breeding record."""
    record = db.query(BreedingRecord).filter(BreedingRecord.id == record_id).first()
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Breeding record not found",
        )
    return record


@router.put("/{record_id}", response_model=BreedingRecordOut)
def update_breeding_record(
    record_id: str, payload: BreedingRecordUpdate, db: Session = Depends(get_db)
):
    """Update breeding record stage, dates, or notes and adjust cow status."""
    record = db.query(BreedingRecord).filter(BreedingRecord.id == record_id).first()
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Breeding record not found",
        )

    cow = db.query(Cattle).filter(Cattle.id == record.cow_id).first()

    if payload.event_date is not None:
        record.event_date = payload.event_date
    if payload.insemination_date is not None:
        record.insemination_date = payload.insemination_date
    if payload.sire_rfid_or_code is not None:
        record.sire_rfid_or_code = payload.sire_rfid_or_code
    if payload.notes is not None:
        record.notes = payload.notes

    if payload.stage is not None:
        normalized_stage = payload.stage.strip().title()
        record.stage = normalized_stage
        if normalized_stage == "Inseminated":
            insem_date = record.insemination_date or record.event_date
            record.insemination_date = insem_date
            record.gestation_check_due_date = insem_date + timedelta(days=44)
            record.expected_calving_date = insem_date + timedelta(days=283)
            if cow:
                cow.status = "Inseminated"
        elif normalized_stage == "Confirmed Pregnant":
            if cow:
                cow.status = "Pregnant"
            insem_date = record.insemination_date or record.event_date
            if insem_date:
                record.expected_calving_date = insem_date + timedelta(days=283)
        elif normalized_stage == "Dry Period":
            if cow:
                cow.status = "Dry"
        elif normalized_stage == "Calved":
            if cow:
                cow.status = "Lactating"
        elif normalized_stage in ("In Heat", "Failed Conception"):
            if cow:
                cow.status = "Active"

    record.updated_at = datetime.now(timezone.utc)
    if cow:
        cow.updated_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(record)
    return record


@router.delete("/{record_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_breeding_record(record_id: str, db: Session = Depends(get_db)):
    """Delete a breeding record."""
    record = db.query(BreedingRecord).filter(BreedingRecord.id == record_id).first()
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Breeding record not found",
        )
    db.delete(record)
    db.commit()
    return None
