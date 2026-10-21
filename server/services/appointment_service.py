import uuid
from datetime import datetime, timedelta, date, time
from typing import Optional, Tuple, List
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc

from server.models import Appointment, Doctor, Patient, User
from server.schemas.appointment import AppointmentCreateRequest, AppointmentStatusUpdate
from server.services.audit_service import log_action


def generate_appointment_code(db: Session) -> str:
    last_appt = db.query(Appointment).order_by(desc(Appointment.created_at)).first()
    if not last_appt or not last_appt.appointment_code.startswith("APT-"):
        count = db.query(Appointment).count()
        return f"APT-{2001 + count}"
    try:
        num = int(last_appt.appointment_code.replace("APT-", "")) + 1
        return f"APT-{num}"
    except ValueError:
        count = db.query(Appointment).count()
        return f"APT-{2001 + count}"


def book_appointment(
    db: Session,
    appointment_in: AppointmentCreateRequest,
    current_user: Optional[User] = None,
) -> Appointment:
    # 1. Validate patient
    patient = db.query(Patient).filter(Patient.id == appointment_in.patient_id).first()
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient with ID {appointment_in.patient_id} not found",
        )

    # 2. Validate doctor
    doctor = db.query(Doctor).filter(Doctor.id == appointment_in.doctor_id).first()
    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Doctor with ID {appointment_in.doctor_id} not found",
        )
    if not doctor.is_available:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Doctor {doctor.doctor_code} is currently not available for bookings",
        )

    # 3. Calculate slot end time
    slot_minutes = doctor.slot_duration_minutes or 30
    # Strip timezone or normalize to naive UTC if datetime has tzinfo
    start_dt = appointment_in.scheduled_start
    if start_dt.tzinfo is not None:
        start_dt = start_dt.replace(tzinfo=None)
    end_dt = start_dt + timedelta(minutes=slot_minutes)

    # 4. Check for doctor slot collisions (Double-booking prevention)
    collision = (
        db.query(Appointment)
        .filter(
            Appointment.doctor_id == appointment_in.doctor_id,
            Appointment.status.in_(["PENDING", "CONFIRMED", "IN_PROGRESS"]),
            Appointment.scheduled_start < end_dt,
            Appointment.scheduled_end > start_dt,
        )
        .first()
    )

    if collision:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Doctor slot is unavailable: already booked for appointment {collision.appointment_code}",
        )

    # 5. Create appointment
    appointment_code = generate_appointment_code(db)
    appointment = Appointment(
        id=str(uuid.uuid4()),
        appointment_code=appointment_code,
        patient_id=appointment_in.patient_id,
        doctor_id=appointment_in.doctor_id,
        scheduled_start=start_dt,
        scheduled_end=end_dt,
        status="CONFIRMED",
        reason_for_visit=appointment_in.reason_for_visit,
        created_by=current_user.id if current_user else None,
    )
    db.add(appointment)
    db.commit()
    db.refresh(appointment)

    log_action(
        db,
        action="BOOK_APPOINTMENT",
        resource_type="APPOINTMENT",
        resource_id=appointment.id,
        user_id=current_user.id if current_user else None,
        details={
            "appointment_code": appointment_code,
            "doctor_id": appointment.doctor_id,
            "patient_id": appointment.patient_id,
            "scheduled_start": str(start_dt),
        },
    )
    return appointment


def update_appointment_status(
    db: Session,
    appointment_id: str,
    status_in: AppointmentStatusUpdate,
    current_user: Optional[User] = None,
) -> Appointment:
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found",
        )

    new_status = status_in.status.upper()
    valid_statuses = ["PENDING", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED"]
    if new_status not in valid_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid appointment status: {status_in.status}. Must be one of {valid_statuses}",
        )

    old_status = appointment.status
    appointment.status = new_status
    if new_status == "CANCELLED" and status_in.cancellation_reason:
        appointment.cancellation_reason = status_in.cancellation_reason

    db.commit()
    db.refresh(appointment)

    log_action(
        db,
        action=f"TRANSITION_APPOINTMENT_{new_status}",
        resource_type="APPOINTMENT",
        resource_id=appointment.id,
        user_id=current_user.id if current_user else None,
        details={
            "old_status": old_status,
            "new_status": new_status,
            "reason": status_in.cancellation_reason,
        },
    )
    return appointment


def get_appointment_by_id(
    db: Session,
    appointment_id: str,
    current_user: Optional[User] = None,
) -> Appointment:
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found",
        )
    return appointment


def list_appointments(
    db: Session,
    doctor_id: Optional[str] = None,
    patient_id: Optional[str] = None,
    target_date: Optional[date] = None,
    status_filter: Optional[str] = None,
    skip: int = 0,
    limit: int = 20,
    current_user: Optional[User] = None,
) -> Tuple[List[Appointment], int]:
    query = db.query(Appointment)

    if doctor_id:
        query = query.filter(Appointment.doctor_id == doctor_id)
    if patient_id:
        query = query.filter(Appointment.patient_id == patient_id)
    if status_filter:
        query = query.filter(Appointment.status == status_filter.upper())
    if target_date:
        day_start = datetime.combine(target_date, time.min)
        day_end = datetime.combine(target_date, time.max)
        query = query.filter(
            Appointment.scheduled_start >= day_start,
            Appointment.scheduled_start <= day_end,
        )

    total = query.count()
    items = (
        query.order_by(desc(Appointment.scheduled_start))
        .offset(skip)
        .limit(limit)
        .all()
    )
    return items, total
