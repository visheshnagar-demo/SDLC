from datetime import datetime, timedelta, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from server.database import get_db
from server.models import Cattle, HealthRecord
from server.schemas import (
    HealthRecordCreate,
    HealthRecordOut,
    ActiveWithdrawalOut,
    VetScheduleCreate,
)

router = APIRouter(
    prefix="/api/v1/health-records", tags=["Health & Veterinary Services"]
)


def to_utc(dt: Optional[datetime]) -> Optional[datetime]:
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


class BulkMilkVerifyRequest(BaseModel):
    cow_ids: List[str]


class BulkWizardCheckResponse(BaseModel):
    compliant: bool
    blocked_cow_ids: List[str] = []
    active_withholding_records: List[ActiveWithdrawalOut] = []
    message: str


@router.get("", response_model=List[HealthRecordOut])
def list_health_records(
    cow_id: Optional[str] = Query(None),
    record_type: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=500),
    db: Session = Depends(get_db),
):
    """Retrieve veterinary encounters, treatments, and vaccination history."""
    query = db.query(HealthRecord)
    if cow_id:
        query = query.filter(HealthRecord.cow_id == cow_id)
    if record_type:
        query = query.filter(HealthRecord.record_type.ilike(record_type))
    if status_filter:
        query = query.filter(HealthRecord.status.ilike(status_filter))

    return (
        query.order_by(
            HealthRecord.treatment_date.desc(), HealthRecord.created_at.desc()
        )
        .offset(skip)
        .limit(limit)
        .all()
    )


@router.get("/schedules", response_model=List[HealthRecordOut])
def list_scheduled_vet_visits(
    upcoming_only: bool = Query(True),
    db: Session = Depends(get_db),
):
    """Retrieve scheduled routine vet checkups and upcoming vaccinations."""
    now = datetime.now(timezone.utc)
    query = db.query(HealthRecord).filter(
        HealthRecord.record_type.in_(
            ["Routine Check", "Scheduled Visit", "Vaccination"]
        ),
        HealthRecord.scheduled_date.isnot(None),
    )
    if upcoming_only:
        query = query.filter(HealthRecord.status == "Scheduled")

    return query.order_by(HealthRecord.scheduled_date.asc()).all()


@router.post(
    "/schedule-visit",
    response_model=HealthRecordOut,
    status_code=status.HTTP_201_CREATED,
)
def schedule_vet_visit(payload: VetScheduleCreate, db: Session = Depends(get_db)):
    """Schedule a routine veterinary visit, herd health check, or vaccination event."""
    cow = db.query(Cattle).filter(Cattle.id == payload.cow_id).first()
    if not cow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Cattle with ID '{payload.cow_id}' not found",
        )

    sched_date = to_utc(payload.scheduled_date) or datetime.now(timezone.utc)

    record = HealthRecord(
        cow_id=payload.cow_id,
        record_type="Scheduled Visit",
        diagnosis=payload.diagnosis,
        dosage=payload.notes,
        treatment_date=sched_date,
        scheduled_date=sched_date,
        status="Scheduled",
        milk_withdrawal_hours=0,
        milk_withdrawal_end=None,
        meat_withdrawal_days=0,
        veterinarian_name=payload.veterinarian_name,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@router.get("/active-withdrawals", response_model=List[ActiveWithdrawalOut])
def list_active_withdrawals(db: Session = Depends(get_db)):
    """List all cattle currently subject to mandatory milk withdrawal due to active medical treatments."""
    now = datetime.now(timezone.utc)
    records = (
        db.query(HealthRecord)
        .join(Cattle, HealthRecord.cow_id == Cattle.id)
        .filter(HealthRecord.milk_withdrawal_end.isnot(None))
        .all()
    )

    results = []
    for r in records:
        end_utc = to_utc(r.milk_withdrawal_end)
        treat_utc = to_utc(r.treatment_date) or now
        if end_utc and end_utc > now:
            cow = r.cow
            diff_hours = (end_utc - now).total_seconds() / 3600.0
            results.append(
                ActiveWithdrawalOut(
                    record_id=r.id,
                    cow_id=r.cow_id,
                    tag_number=cow.tag_number if cow else "Unknown",
                    rfid_tag=cow.rfid_tag if cow else "Unknown",
                    medication_administered=r.medication_administered,
                    diagnosis=r.diagnosis,
                    treatment_date=treat_utc,
                    milk_withdrawal_hours=r.milk_withdrawal_hours,
                    milk_withdrawal_end=end_utc,
                    hours_remaining=round(max(0.0, diff_hours), 1),
                )
            )
    return results


@router.post("/verify-bulk-milk", response_model=BulkWizardCheckResponse)
def verify_bulk_milk_compliance(
    payload: BulkMilkVerifyRequest, db: Session = Depends(get_db)
):
    """Validate that none of the provided cattle are under active milk withdrawal before inclusion in bulk tank sales."""
    now = datetime.now(timezone.utc)
    potential_records = (
        db.query(HealthRecord)
        .join(Cattle, HealthRecord.cow_id == Cattle.id)
        .filter(
            HealthRecord.cow_id.in_(payload.cow_ids),
            HealthRecord.milk_withdrawal_end.isnot(None),
        )
        .all()
    )

    violating_records = []
    for r in potential_records:
        end_utc = to_utc(r.milk_withdrawal_end)
        if end_utc and end_utc > now:
            violating_records.append((r, end_utc))

    if violating_records:
        blocked_ids = list(set(r.cow_id for r, _ in violating_records))
        active_list = []
        for r, end_utc in violating_records:
            cow = r.cow
            diff_hours = (end_utc - now).total_seconds() / 3600.0
            treat_utc = to_utc(r.treatment_date) or now
            active_list.append(
                ActiveWithdrawalOut(
                    record_id=r.id,
                    cow_id=r.cow_id,
                    tag_number=cow.tag_number if cow else "Unknown",
                    rfid_tag=cow.rfid_tag if cow else "Unknown",
                    medication_administered=r.medication_administered,
                    diagnosis=r.diagnosis,
                    treatment_date=treat_utc,
                    milk_withdrawal_hours=r.milk_withdrawal_hours,
                    milk_withdrawal_end=end_utc,
                    hours_remaining=round(max(0.0, diff_hours), 1),
                )
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error": "Compliance Block: Active Withdrawal",
                "message": f"Critical compliance block: {len(blocked_ids)} cows are under active antibiotic withdrawal and their milk cannot be included in bulk tank sales.",
                "blocked_cow_ids": blocked_ids,
            },
        )

    return BulkWizardCheckResponse(
        compliant=True,
        blocked_cow_ids=[],
        active_withholding_records=[],
        message="All cattle are verified compliant. Milk cleared for bulk tank sales.",
    )


@router.post("", response_model=HealthRecordOut, status_code=status.HTTP_201_CREATED)
def create_health_record(payload: HealthRecordCreate, db: Session = Depends(get_db)):
    """Log a veterinary encounter or treatment with automated milk/meat withdrawal calculations."""
    cow = db.query(Cattle).filter(Cattle.id == payload.cow_id).first()
    if not cow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Cattle with ID '{payload.cow_id}' not found",
        )

    treat_date = payload.treatment_date or datetime.now(timezone.utc)
    treat_date = to_utc(treat_date) or datetime.now(timezone.utc)

    milk_withdrawal_end = None
    if payload.milk_withdrawal_hours > 0:
        milk_withdrawal_end = treat_date + timedelta(
            hours=payload.milk_withdrawal_hours
        )

    sched_date = to_utc(payload.scheduled_date)

    record = HealthRecord(
        cow_id=payload.cow_id,
        record_type=payload.record_type,
        diagnosis=payload.diagnosis,
        medication_administered=payload.medication_administered,
        dosage=payload.dosage,
        treatment_date=treat_date,
        scheduled_date=sched_date,
        status=payload.status,
        milk_withdrawal_hours=payload.milk_withdrawal_hours,
        milk_withdrawal_end=milk_withdrawal_end,
        meat_withdrawal_days=payload.meat_withdrawal_days,
        veterinarian_name=payload.veterinarian_name,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@router.get("/{record_id}", response_model=HealthRecordOut)
def get_health_record(record_id: str, db: Session = Depends(get_db)):
    """Retrieve details of a specific health or treatment record."""
    record = db.query(HealthRecord).filter(HealthRecord.id == record_id).first()
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Health record not found",
        )
    return record


@router.delete("/{record_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_health_record(record_id: str, db: Session = Depends(get_db)):
    """Delete a health record."""
    record = db.query(HealthRecord).filter(HealthRecord.id == record_id).first()
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Health record not found",
        )
    db.delete(record)
    db.commit()
    return None
