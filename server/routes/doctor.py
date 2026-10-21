from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from server.database import get_db
from server.models.user import User
from server.schemas.doctor import (
    DoctorResponse,
    DoctorAvailabilityResponse,
    ScheduleCreateRequest,
    ScheduleResponse,
)
from server.services.doctor_service import DoctorService
from server.services.auth_service import get_current_user, require_roles

router = APIRouter(prefix="/doctors", tags=["Doctors"])

@router.get("", response_model=List[DoctorResponse])
def list_doctors(
    department: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return DoctorService.list_doctors(db, department=department)

@router.get("/{doctor_id}/availability", response_model=DoctorAvailabilityResponse)
def get_doctor_availability(
    doctor_id: str,
    date: str = Query(..., description="Date in YYYY-MM-DD format"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return DoctorService.get_availability(db, doctor_id=doctor_id, date_str=date)

@router.post("/{doctor_id}/schedules", response_model=ScheduleResponse, status_code=status.HTTP_201_CREATED)
def create_doctor_schedule(
    doctor_id: str,
    schedule_data: ScheduleCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["ADMIN", "DOCTOR"])),
):
    return DoctorService.create_or_update_schedule(db, doctor_id=doctor_id, data=schedule_data)
