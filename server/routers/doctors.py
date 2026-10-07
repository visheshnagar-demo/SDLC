import uuid
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from server.database import get_db
from server.models import User, Doctor
from server.schemas import DoctorCreate, DoctorResponse
from server.dependencies import require_roles

router = APIRouter(prefix="/api/v1/doctors", tags=["Provider & Doctor Management"])


@router.get("", response_model=List[DoctorResponse])
def list_doctors(
    department: Optional[str] = None,
    specialization: Optional[str] = None,
    is_active: Optional[bool] = None,
    is_available: Optional[bool] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
):
    query = db.query(Doctor).join(User, Doctor.user_id == User.id)

    if department:
        query = query.filter(Doctor.department.ilike(f"%{department}%"))

    if specialization:
        query = query.filter(Doctor.specialization.ilike(f"%{specialization}%"))

    avail = is_available if is_available is not None else is_active
    if avail is not None:
        query = query.filter(Doctor.is_available == avail)

    doctors = query.offset(skip).limit(limit).all()
    return doctors


@router.get("/{doctor_id}", response_model=DoctorResponse)
def get_doctor(doctor_id: str, db: Session = Depends(get_db)):
    doctor = db.query(Doctor).filter(Doctor.id == doctor_id).first()
    if not doctor:
        # Check by user_id
        doctor = db.query(Doctor).filter(Doctor.user_id == doctor_id).first()

    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Doctor with id {doctor_id} not found.",
        )

    return doctor


@router.post("", response_model=DoctorResponse, status_code=status.HTTP_201_CREATED)
def create_doctor(
    doctor_in: DoctorCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["ADMIN"])),
):
    # Check user exists
    target_user = db.query(User).filter(User.id == doctor_in.user_id).first()
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with id {doctor_in.user_id} not found.",
        )

    existing = db.query(Doctor).filter(Doctor.user_id == doctor_in.user_id).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A doctor profile already exists for this user.",
        )

    new_doc = Doctor(
        id=str(uuid.uuid4()),
        user_id=doctor_in.user_id,
        department=doctor_in.department,
        specialization=doctor_in.specialization,
        consultation_fee=doctor_in.consultation_fee,
        slot_duration_minutes=doctor_in.slot_duration_minutes,
        is_available=doctor_in.is_available,
    )
    db.add(new_doc)
    db.commit()
    db.refresh(new_doc)
    return new_doc
