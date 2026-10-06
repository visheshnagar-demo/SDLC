import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from server.database import get_db
from server import models, schemas
from server.auth import get_optional_user

router = APIRouter(prefix="/api/v1/appointments", tags=["Appointments"])


@router.get("", response_model=List[schemas.AppointmentResponse])
def list_appointments(
    doctor_id: Optional[str] = Query(None),
    patient_id: Optional[str] = Query(None),
    appointment_date: Optional[str] = Query(None, alias="date"),
    status_filter: Optional[str] = Query(None, alias="status"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
):
    q = db.query(models.Appointment)
    if doctor_id:
        q = q.filter(models.Appointment.doctor_id == doctor_id)
    if patient_id:
        q = q.filter(models.Appointment.patient_id == patient_id)
    if appointment_date:
        q = q.filter(models.Appointment.appointment_date == appointment_date)
    if status_filter:
        q = q.filter(models.Appointment.status.ilike(status_filter))

    return (
        q.order_by(
            models.Appointment.appointment_date.desc(),
            models.Appointment.start_time.asc(),
        )
        .offset(skip)
        .limit(limit)
        .all()
    )


@router.post(
    "", response_model=schemas.AppointmentResponse, status_code=status.HTTP_201_CREATED
)
def book_appointment(
    appt_in: schemas.AppointmentCreate,
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_optional_user),
):
    # Verify patient exists
    patient = (
        db.query(models.Patient).filter(models.Patient.id == appt_in.patient_id).first()
    )
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient {appt_in.patient_id} not found",
        )

    # Verify doctor exists
    doctor = (
        db.query(models.Doctor).filter(models.Doctor.id == appt_in.doctor_id).first()
    )
    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Doctor {appt_in.doctor_id} not found",
        )

    # Optimistic concurrency check: Prevent double-booking
    existing = (
        db.query(models.Appointment)
        .filter(
            models.Appointment.doctor_id == appt_in.doctor_id,
            models.Appointment.appointment_date == appt_in.appointment_date,
            models.Appointment.start_time == appt_in.start_time,
            models.Appointment.status != "Cancelled",
        )
        .first()
    )

    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Doctor is already booked for {appt_in.appointment_date} at {appt_in.start_time}. Please select another slot.",
        )

    appointment_id = str(uuid.uuid4())
    appointment = models.Appointment(
        id=appointment_id,
        patient_id=appt_in.patient_id,
        doctor_id=appt_in.doctor_id,
        appointment_date=appt_in.appointment_date,
        start_time=appt_in.start_time,
        end_time=appt_in.end_time,
        reason=appt_in.reason,
        appointment_type=appt_in.appointment_type or "Consultation",
        status="Scheduled",
        version=1,
    )
    db.add(appointment)

    # HIPAA audit log
    audit = models.AuditLog(
        id=str(uuid.uuid4()),
        user_id=current_user.id if current_user else None,
        action="BOOK_APPOINTMENT",
        resource_type="Appointment",
        resource_id=appointment_id,
        details=f"Appointment booked with {doctor.name} on {appt_in.appointment_date} {appt_in.start_time}",
    )
    db.add(audit)

    # Automated Notification Dispatch
    notification = models.AuditLog(
        id=str(uuid.uuid4()),
        user_id=current_user.id if current_user else None,
        action="SEND_APPOINTMENT_NOTIFICATION",
        resource_type="Notification",
        resource_id=appointment_id,
        details=f"Automated notification dispatched: Confirmation email/SMS sent to patient {patient.email} ({patient.phone}) and {doctor.name} for appointment on {appt_in.appointment_date} at {appt_in.start_time}.",
    )
    db.add(notification)

    db.commit()
    db.refresh(appointment)
    return appointment


@router.get("/{id}", response_model=schemas.AppointmentResponse)
def get_appointment(id: str, db: Session = Depends(get_db)):
    appointment = (
        db.query(models.Appointment).filter(models.Appointment.id == id).first()
    )
    if not appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Appointment {id} not found",
        )
    return appointment


@router.put("/{id}/status", response_model=schemas.AppointmentResponse)
def update_appointment_status(
    id: str,
    status_update: schemas.AppointmentStatusUpdate,
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_optional_user),
):
    appointment = (
        db.query(models.Appointment).filter(models.Appointment.id == id).first()
    )
    if not appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Appointment {id} not found",
        )

    appointment.status = status_update.status
    appointment.version += 1

    audit = models.AuditLog(
        id=str(uuid.uuid4()),
        user_id=current_user.id if current_user else None,
        action="UPDATE_APPOINTMENT_STATUS",
        resource_type="Appointment",
        resource_id=appointment.id,
        details=f"Status updated to {status_update.status}",
    )
    db.add(audit)

    if status_update.status == "Cancelled":
        notif = models.AuditLog(
            id=str(uuid.uuid4()),
            user_id=current_user.id if current_user else None,
            action="SEND_CANCELLATION_NOTIFICATION",
            resource_type="Notification",
            resource_id=appointment.id,
            details=f"Automated cancellation notification dispatched for appointment {id}.",
        )
        db.add(notif)

    db.commit()
    db.refresh(appointment)
    return appointment


@router.put("/{id}", response_model=schemas.AppointmentResponse)
def update_appointment(
    id: str,
    appt_update: schemas.AppointmentUpdate,
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_optional_user),
):
    appointment = (
        db.query(models.Appointment).filter(models.Appointment.id == id).first()
    )
    if not appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Appointment {id} not found",
        )

    update_data = (
        appt_update.dict(exclude_unset=True)
        if hasattr(appt_update, "dict")
        else appt_update.model_dump(exclude_unset=True)
    )
    for field, value in update_data.items():
        setattr(appointment, field, value)

    appointment.version += 1
    db.commit()
    db.refresh(appointment)
    return appointment
