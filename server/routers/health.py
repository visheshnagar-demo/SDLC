from datetime import date
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from server.database import get_db
from server.models import Cow, HealthRecord, User
from server.schemas import HealthRecordCreate, HealthRecordResponse
from server.auth import get_current_user, require_farm_manager

router = APIRouter(prefix="/health-records", tags=["Health & Veterinary"])


@router.get(
    "",
    response_model=List[HealthRecordResponse],
    status_code=status.HTTP_200_OK,
    summary="List medical checkup and vaccination records",
)
def list_health_records(
    cow_id: Optional[str] = Query(None, description="Filter by Cow ID"),
    record_type: Optional[str] = Query(
        None,
        description="Filter by record type (Vaccination, Checkup, Treatment, Deworming)",
    ),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(HealthRecord)
    if cow_id:
        query = query.filter(HealthRecord.cow_id == cow_id)
    if record_type:
        query = query.filter(HealthRecord.record_type == record_type)

    records = (
        query.order_by(HealthRecord.event_date.desc()).offset(skip).limit(limit).all()
    )
    return records


@router.post(
    "",
    response_model=HealthRecordResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Record medical treatment or vaccination (Farm Manager only)",
)
def create_health_record(
    record_in: HealthRecordCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_farm_manager),
):
    # Verify cow exists
    cow = db.query(Cow).filter(Cow.id == record_in.cow_id).first()
    if not cow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Cow with ID '{record_in.cow_id}' not found",
        )

    # Event date check
    if record_in.event_date > date.today():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Event date cannot be in the future",
        )

    record = HealthRecord(
        cow_id=record_in.cow_id,
        record_type=record_in.record_type.strip(),
        title=record_in.title.strip(),
        diagnosis=record_in.diagnosis.strip() if record_in.diagnosis else None,
        treatment_plan=record_in.treatment_plan.strip()
        if record_in.treatment_plan
        else None,
        event_date=record_in.event_date,
        next_due_date=record_in.next_due_date,
        administered_by=record_in.administered_by.strip(),
    )
    db.add(record)

    # If record_type is Treatment or Checkup with diagnosis, optionally update cow health status if Sick
    if record_in.record_type.lower() in ["treatment", "sick"]:
        if cow.health_status == "Healthy":
            cow.health_status = "Under Treatment"

    db.commit()
    db.refresh(record)
    return record
