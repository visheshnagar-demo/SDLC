from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy.orm import Session
from server.app.api.deps import (
    get_client_ip,
    get_optional_current_user,
)
from server.app.core.database import get_db
from server.app.models.appointment import Appointment
from server.app.models.doctor import Doctor
from server.app.models.patient import Patient
from server.app.models.user import User
from server.app.schemas.appointment import (
    AppointmentCreate,
    AppointmentResponse,
    AppointmentStatusUpdate,
    DoctorAvailabilityResponse,
)
from server.app.services.appointment_service import (
    book_appointment,
    get_appointment_by_id,
    get_appointments,
    get_doctor_availability,
    update_appointment_status,
)

router = APIRouter(prefix="/appointments", tags=["appointments"])


def _format_appointment_response(db: Session, appt: Appointment) -> AppointmentResponse:
    patient = db.query(Patient).filter(Patient.id == appt.patient_id).first()
    doctor = db.query(Doctor).filter(Doctor.id == appt.doctor_id).first()

    patient_name = f"{patient.first_name} {patient.last_name}" if patient else None
    doctor_name = f"Dr. {doctor.first_name} {doctor.last_name}" if doctor else None
    doctor_specialty = doctor.specialty if doctor else None

    return AppointmentResponse(
        id=appt.id,
        patient_id=appt.patient_id,
        doctor_id=appt.doctor_id,
        appointment_time=appt.appointment_time,
        duration_minutes=appt.duration_minutes,
        status=appt.status,
        reason=appt.reason,
        patient_name=patient_name,
        doctor_name=doctor_name,
        doctor_specialty=doctor_specialty,
        created_at=appt.created_at,
        updated_at=appt.updated_at,
    )


@router.post(
    "", response_model=AppointmentResponse, status_code=status.HTTP_201_CREATED
)
def create_appointment(
    appt_in: AppointmentCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    user_id = current_user.id if current_user else None
    appt = book_appointment(
        db=db,
        appt_in=appt_in,
        current_user_id=user_id,
        ip_address=get_client_ip(request),
    )
    return _format_appointment_response(db, appt)


@router.get("", response_model=List[AppointmentResponse])
def list_appointments(
    request: Request,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    doctor_id: Optional[str] = None,
    patient_id: Optional[str] = None,
    date: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    user_id = current_user.id if current_user else None
    appts = get_appointments(
        db=db,
        skip=skip,
        limit=limit,
        doctor_id=doctor_id,
        patient_id=patient_id,
        date_str=date,
        current_user_id=user_id,
        ip_address=get_client_ip(request),
    )
    return [_format_appointment_response(db, a) for a in appts]


@router.get(
    "/doctors/{doctor_id}/availability", response_model=DoctorAvailabilityResponse
)
def doctor_availability(
    doctor_id: str,
    date: Optional[str] = Query(None, description="Date in YYYY-MM-DD format"),
    db: Session = Depends(get_db),
):
    target_date = date or datetime.now().strftime("%Y-%m-%d")
    return get_doctor_availability(db=db, doctor_id=doctor_id, date_str=target_date)


@router.get("/{appointment_id}", response_model=AppointmentResponse)
def get_appointment(
    appointment_id: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    user_id = current_user.id if current_user else None
    appt = get_appointment_by_id(
        db=db,
        appt_id=appointment_id,
        current_user_id=user_id,
        ip_address=get_client_ip(request),
    )
    if not appt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Appointment with ID '{appointment_id}' not found.",
        )
    return _format_appointment_response(db, appt)


@router.patch("/{appointment_id}/status", response_model=AppointmentResponse)
def change_appointment_status(
    appointment_id: str,
    status_update: AppointmentStatusUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    user_id = current_user.id if current_user else None
    appt = update_appointment_status(
        db=db,
        appt_id=appointment_id,
        new_status=status_update.status,
        current_user_id=user_id,
        ip_address=get_client_ip(request),
    )
    return _format_appointment_response(db, appt)
