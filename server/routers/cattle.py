from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

from server.database import get_db
from server.models import Cattle, MilkLog, BreedingRecord, HealthRecord
from server.schemas import CattleCreate, CattleUpdate, CattleOut, CattleDetailOut

router = APIRouter(prefix="/api/v1/cattle", tags=["Cattle & RFID Management"])


def to_utc(dt: Optional[datetime]) -> Optional[datetime]:
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


@router.get("", response_model=List[CattleOut])
def list_cattle(
    status_filter: Optional[str] = Query(None, alias="status"),
    breed: Optional[str] = Query(None),
    rfid_tag: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=500),
    db: Session = Depends(get_db),
):
    """List cattle with optional filtering by status, breed, RFID tag, or keyword search."""
    query = db.query(Cattle)

    if status_filter:
        query = query.filter(Cattle.status == status_filter)
    if breed:
        query = query.filter(Cattle.breed.ilike(f"%{breed}%"))
    if rfid_tag:
        query = query.filter(Cattle.rfid_tag == rfid_tag)
    if search:
        search_fmt = f"%{search}%"
        query = query.filter(
            or_(
                Cattle.tag_number.ilike(search_fmt),
                Cattle.rfid_tag.ilike(search_fmt),
                Cattle.breed.ilike(search_fmt),
            )
        )

    return query.order_by(Cattle.tag_number.asc()).offset(skip).limit(limit).all()


@router.post("", response_model=CattleOut, status_code=status.HTTP_201_CREATED)
def create_cattle(payload: CattleCreate, db: Session = Depends(get_db)):
    """Register a new cow with RFID ear tag and lineage details."""
    # Check duplicate RFID tag
    existing_rfid = db.query(Cattle).filter(Cattle.rfid_tag == payload.rfid_tag).first()
    if existing_rfid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="RFID tag already assigned",
        )

    # Check duplicate tag number
    existing_tag = (
        db.query(Cattle).filter(Cattle.tag_number == payload.tag_number).first()
    )
    if existing_tag:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tag number already registered",
        )

    # Verify dam and sire if provided
    if payload.dam_id:
        dam = db.query(Cattle).filter(Cattle.id == payload.dam_id).first()
        if not dam:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Dam with ID '{payload.dam_id}' not found",
            )
    if payload.sire_id:
        sire = db.query(Cattle).filter(Cattle.id == payload.sire_id).first()
        if not sire:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Sire with ID '{payload.sire_id}' not found",
            )

    new_cow = Cattle(
        tag_number=payload.tag_number,
        rfid_tag=payload.rfid_tag,
        breed=payload.breed,
        gender=payload.gender,
        date_of_birth=payload.date_of_birth,
        dam_id=payload.dam_id,
        sire_id=payload.sire_id,
        status=payload.status,
        body_condition_score=payload.body_condition_score,
        weight_kg=payload.weight_kg,
    )
    db.add(new_cow)
    db.commit()
    db.refresh(new_cow)
    return new_cow


@router.get("/{cow_id}", response_model=CattleDetailOut)
def get_cattle_detail(cow_id: str, db: Session = Depends(get_db)):
    """Retrieve comprehensive profile, history, and active withdrawal status for a cow."""
    cow = db.query(Cattle).filter(Cattle.id == cow_id).first()
    if not cow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cattle not found",
        )

    now = datetime.now(timezone.utc)
    health_recs = (
        db.query(HealthRecord)
        .filter(
            HealthRecord.cow_id == cow_id,
            HealthRecord.milk_withdrawal_end.isnot(None),
        )
        .all()
    )

    has_active_withdrawal = any(
        to_utc(hr.milk_withdrawal_end) is not None
        and to_utc(hr.milk_withdrawal_end) > now
        for hr in health_recs
    )

    recent_milk = (
        db.query(MilkLog)
        .filter(MilkLog.cow_id == cow_id)
        .order_by(MilkLog.milking_date.desc(), MilkLog.created_at.desc())
        .limit(10)
        .all()
    )

    recent_breeding = (
        db.query(BreedingRecord)
        .filter(BreedingRecord.cow_id == cow_id)
        .order_by(BreedingRecord.event_date.desc())
        .limit(5)
        .all()
    )

    recent_health = (
        db.query(HealthRecord)
        .filter(HealthRecord.cow_id == cow_id)
        .order_by(HealthRecord.treatment_date.desc())
        .limit(5)
        .all()
    )

    return CattleDetailOut(
        id=cow.id,
        tag_number=cow.tag_number,
        rfid_tag=cow.rfid_tag,
        breed=cow.breed,
        gender=cow.gender,
        date_of_birth=cow.date_of_birth,
        dam_id=cow.dam_id,
        sire_id=cow.sire_id,
        status=cow.status,
        body_condition_score=cow.body_condition_score,
        weight_kg=cow.weight_kg,
        created_at=cow.created_at,
        updated_at=cow.updated_at,
        recent_milk_logs=recent_milk,
        recent_breeding_records=recent_breeding,
        recent_health_records=recent_health,
        has_active_withdrawal=has_active_withdrawal,
    )


@router.put("/{cow_id}", response_model=CattleOut)
def update_cattle(cow_id: str, payload: CattleUpdate, db: Session = Depends(get_db)):
    """Update cattle profile, breed, or lifecycle status."""
    cow = db.query(Cattle).filter(Cattle.id == cow_id).first()
    if not cow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cattle not found",
        )

    # Unique check for tag_number
    if payload.tag_number and payload.tag_number != cow.tag_number:
        existing = (
            db.query(Cattle)
            .filter(Cattle.tag_number == payload.tag_number, Cattle.id != cow_id)
            .first()
        )
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Tag number already registered",
            )
        cow.tag_number = payload.tag_number

    # Unique check for rfid_tag
    if payload.rfid_tag and payload.rfid_tag != cow.rfid_tag:
        existing = (
            db.query(Cattle)
            .filter(Cattle.rfid_tag == payload.rfid_tag, Cattle.id != cow_id)
            .first()
        )
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="RFID tag already assigned",
            )
        cow.rfid_tag = payload.rfid_tag

    if payload.breed is not None:
        cow.breed = payload.breed
    if payload.gender is not None:
        cow.gender = payload.gender
    if payload.date_of_birth is not None:
        cow.date_of_birth = payload.date_of_birth
    if payload.dam_id is not None:
        cow.dam_id = payload.dam_id
    if payload.sire_id is not None:
        cow.sire_id = payload.sire_id
    if payload.status is not None:
        cow.status = payload.status
    if payload.body_condition_score is not None:
        cow.body_condition_score = payload.body_condition_score
    if payload.weight_kg is not None:
        cow.weight_kg = payload.weight_kg

    cow.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(cow)
    return cow


@router.delete("/{cow_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_cattle(cow_id: str, db: Session = Depends(get_db)):
    """Delete a cattle record."""
    cow = db.query(Cattle).filter(Cattle.id == cow_id).first()
    if not cow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cattle not found",
        )
    db.delete(cow)
    db.commit()
    return None
