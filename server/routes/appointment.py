from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from server.database import get_db
from server.models.user import User
from server.schemas.appointment import (
    AppointmentCreateRequest,
    AppointmentStatusUpdate,
    AppointmentResponse,
)
from server.schemas.clinical_record import (
    ClinicalRecordCreateRequest,
    ClinicalRecordResponse,
)
from server.services.appointment_service import AppointmentService
from server.services.clinical_service import ClinicalService
from server.services.auth_service import get_current_user, require_roles

router = APIRouter(prefix="/appointments", tags=["Appointments"])

@router.post("", response_model=AppointmentResponse, status_code=status.HTTP_201_CREATED)
def create_appointment(
    appointment_data: AppointmentCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["ADMIN", "RECEPTIONIST", "DOCTOR", "NURSE", "PATIENT"])),
):
    return AppointmentService.create_appointment(db, appointment_data, current_user.id)

@router.get("", response_model=List[AppointmentResponse])
def list_appointments(
    doctor_id: Optional[str] = Query(None),
    patient_id: Optional[str] = Query(None),
    date: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return AppointmentService.list_appointments(
        db,
        doctor_id=doctor_id,
        patient_id=patient_id,
        date=date,
        status_filter=status,
        skip=skip,
        limit=limit,
    )

@router.get("/{appointment_id}", response_model=AppointmentResponse)
def get_appointment(
    appointment_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    apt = AppointmentService.get_appointment_by_id(db, appointment_id)
    p_name = f"{apt.patient.first_name} {apt.patient.last_name}" if apt.patient else None
    d_name = apt.doctor.user.full_name if (apt.doctor and apt.doctor.user) else None
    return AppointmentResponse(
        id=apt.id,
        appointment_code=apt.appointment_code,
        patient_id=apt.patient_id,
        doctor_id=apt.doctor_id,
        scheduled_start=apt.scheduled_start,
        scheduled_end=apt.scheduled_end,
        status=apt.status,
        reason_for_visit=apt.reason_for_visit,
        cancellation_reason=apt.cancellation_reason,
        created_by=apt.created_by,
        patient_name=p_name,
        doctor_name=d_name,
        created_at=apt.created_at,
        updated_at=apt.updated_at,
    )

@router.patch("/{appointment_id}/status", response_model=AppointmentResponse)
def update_appointment_status(
    appointment_id: str,
    status_data: AppointmentStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["ADMIN", "DOCTOR", "RECEPTIONIST", "NURSE"])),
):
    apt = AppointmentService.update_status(db, appointment_id, status_data, current_user.id)
    p_name = f"{apt.patient.first_name} {apt.patient.last_name}" if apt.patient else None
    d_name = apt.doctor.user.full_name if (apt.doctor and apt.doctor.user) else None
    return AppointmentResponse(
        id=apt.id,
        appointment_code=apt.appointment_code,
        patient_id=apt.patient_id,
        doctor_id=apt.doctor_id,
        scheduled_start=apt.scheduled_start,
        scheduled_end=apt.scheduled_end,
        status=apt.status,
        reason_for_visit=apt.reason_for_visit,
        cancellation_reason=apt.cancellation_reason,
        created_by=apt.created_by,
        patient_name=p_name,
        doctor_name=d_name,
        created_at=apt.created_at,
        updated_at=apt.updated_at,
    )

@router.post("/{appointment_id}/records", response_model=ClinicalRecordResponse, status_code=status.HTTP_201_CREATED)
def create_clinical_record(
    appointment_id: str,
    record_data: ClinicalRecordCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["ADMIN", "DOCTOR"])),
):
    return ClinicalService.create_record(db, appointment_id, record_data, current_user.id)

@router.get("/{appointment_id}/records", response_model=ClinicalRecordResponse)
def get_clinical_record(
    appointment_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["ADMIN", "DOCTOR", "NURSE", "PATIENT"])),
):
    return ClinicalService.get_record(db, appointment_id, current_user.id)
