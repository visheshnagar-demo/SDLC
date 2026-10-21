from typing import Optional, List
from datetime import date
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from server.database import get_db
from server.models import User
from server.schemas.doctor import (
    DoctorResponse,
    ScheduleCreateRequest,
    ScheduleResponse,
    DoctorAvailabilityResponse,
)
from server.services.auth_service import get_current_user, require_roles
from server.services.doctor_service import (
    list_doctors,
    get_doctor_by_id,
    configure_doctor_schedule,
    get_doctor_availability,
)

router = APIRouter(prefix="/doctors", tags=["Doctors"])


@router.get("", response_model=List[DoctorResponse])
def get_doctors(
    department: Optional[str] = Query(None),
    is_available: Optional[bool] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    doctors = list_doctors(db, department=department, is_available=is_available)
    return [DoctorResponse.from_orm(d) for d in doctors]


@router.get("/{id}", response_model=DoctorResponse)
def get_doctor(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    doctor = get_doctor_by_id(db, id)
    return DoctorResponse.from_orm(doctor)


@router.get("/{id}/availability", response_model=DoctorAvailabilityResponse)
def check_doctor_availability(
    id: str,
    date: date = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_doctor_availability(db, id, target_date=date)


@router.post(
    "/{id}/schedules",
    response_model=ScheduleResponse,
    status_code=status.HTTP_201_CREATED,
)
def set_doctor_schedule(
    id: str,
    schedule_in: ScheduleCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["ADMIN", "DOCTOR"])),
):
    schedule = configure_doctor_schedule(db, id, schedule_in, current_user=current_user)
    return ScheduleResponse.from_orm(schedule)
