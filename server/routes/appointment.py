from typing import Optional
from datetime import date
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from server.database import get_db
from server.models import User
from server.schemas.appointment import (
    AppointmentCreateRequest,
    AppointmentStatusUpdate,
    AppointmentResponse,
    PaginatedAppointments,
)
from server.services.auth_service import get_current_user, require_roles
from server.services.appointment_service import (
    book_appointment,
    update_appointment_status,
    get_appointment_by_id,
    list_appointments,
)

router = APIRouter(prefix="/appointments", tags=["Appointments"])


@router.post(
    "", response_model=AppointmentResponse, status_code=status.HTTP_201_CREATED
)
def create_appointment(
    appointment_in: AppointmentCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(["ADMIN", "RECEPTIONIST", "DOCTOR", "NURSE", "PATIENT"])
    ),
):
    appointment = book_appointment(db, appointment_in, current_user=current_user)
    return AppointmentResponse.from_orm(appointment)


@router.get("", response_model=PaginatedAppointments)
def get_appointments(
    doctor_id: Optional[str] = Query(None),
    patient_id: Optional[str] = Query(None),
    date: Optional[date] = Query(None),
    status: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    items, total = list_appointments(
        db,
        doctor_id=doctor_id,
        patient_id=patient_id,
        target_date=date,
        status_filter=status,
        skip=skip,
        limit=limit,
        current_user=current_user,
    )
    return PaginatedAppointments(
        items=[AppointmentResponse.from_orm(a) for a in items],
        total=total,
        skip=skip,
        limit=limit,
    )


@router.get("/{id}", response_model=AppointmentResponse)
def get_appointment(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    appointment = get_appointment_by_id(db, id, current_user=current_user)
    return AppointmentResponse.from_orm(appointment)


@router.patch("/{id}/status", response_model=AppointmentResponse)
def change_appointment_status(
    id: str,
    status_in: AppointmentStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(["ADMIN", "DOCTOR", "RECEPTIONIST", "NURSE"])
    ),
):
    appointment = update_appointment_status(
        db, id, status_in, current_user=current_user
    )
    return AppointmentResponse.from_orm(appointment)
