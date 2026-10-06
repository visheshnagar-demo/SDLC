import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from server.database import get_db
from server import models, schemas

router = APIRouter(prefix="/api/v1/doctors", tags=["Doctors"])


@router.get("", response_model=List[schemas.DoctorResponse])
def list_doctors(
    department: Optional[str] = Query(None),
    specialty: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    q = db.query(models.Doctor)
    if department:
        q = q.filter(models.Doctor.department.ilike(f"%{department}%"))
    if specialty:
        q = q.filter(models.Doctor.specialty.ilike(f"%{specialty}%"))
    return q.all()


@router.post(
    "", response_model=schemas.DoctorResponse, status_code=status.HTTP_201_CREATED
)
def create_doctor(
    doctor_in: schemas.DoctorCreate,
    db: Session = Depends(get_db),
):
    doctor = models.Doctor(
        id=str(uuid.uuid4()),
        user_id=doctor_in.user_id,
        name=doctor_in.name,
        specialty=doctor_in.specialty,
        department=doctor_in.department,
        consultation_fee=doctor_in.consultation_fee,
        available_days=doctor_in.available_days or "Mon,Tue,Wed,Thu,Fri",
        slot_duration_minutes=doctor_in.slot_duration_minutes or 30,
    )
    db.add(doctor)
    db.commit()
    db.refresh(doctor)
    return doctor


@router.get("/{id}", response_model=schemas.DoctorResponse)
def get_doctor(id: str, db: Session = Depends(get_db)):
    doctor = db.query(models.Doctor).filter(models.Doctor.id == id).first()
    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Doctor with ID {id} not found",
        )
    return doctor
