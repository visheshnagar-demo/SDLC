import uuid
from datetime import datetime, time, timedelta
from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from server.app.models.appointment import Appointment
from server.app.models.doctor import Doctor
from server.app.models.patient import Patient
from server.app.schemas.appointment import (
    AppointmentCreate,
    DoctorAvailabilityResponse,
    TimeSlot,
)
from server.app.services.audit_service import log_audit


def book_appointment(
    db: Session,
    appt_in: AppointmentCreate,
    current_user_id: Optional[str] = None,
    ip_address: Optional[str] = None,
) -> Appointment:
    # Verify patient exists
    patient = db.query(Patient).filter(Patient.id == appt_in.patient_id).first()
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient with ID '{appt_in.patient_id}' not found.",
        )

    # Verify doctor exists
    doctor = db.query(Doctor).filter(Doctor.id == appt_in.doctor_id).first()
    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Doctor with ID '{appt_in.doctor_id}' not found.",
        )

    # Double-booking prevention check
    # Check if doctor already has an active appointment at that time
    existing_appt = (
        db.query(Appointment)
        .filter(
            Appointment.doctor_id == appt_in.doctor_id,
            Appointment.appointment_time == appt_in.appointment_time,
            Appointment.status != "CANCELLED",
        )
        .first()
    )

    if existing_appt:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Double-booking conflict: This doctor already has an appointment scheduled at the selected time slot.",
        )

    appointment = Appointment(
        id=str(uuid.uuid4()),
        patient_id=appt_in.patient_id,
        doctor_id=appt_in.doctor_id,
        appointment_time=appt_in.appointment_time,
        duration_minutes=appt_in.duration_minutes or 30,
        status="SCHEDULED",
        reason=appt_in.reason,
    )
    db.add(appointment)
    db.commit()
    db.refresh(appointment)

    log_audit(
        db=db,
        action="BOOK_APPOINTMENT",
        entity_type="Appointment",
        entity_id=appointment.id,
        user_id=current_user_id,
        details={
            "doctor_id": appointment.doctor_id,
            "patient_id": appointment.patient_id,
            "time": appointment.appointment_time.isoformat(),
        },
        ip_address=ip_address,
    )

    return appointment


def get_appointments(
    db: Session,
    skip: int = 0,
    limit: int = 50,
    doctor_id: Optional[str] = None,
    patient_id: Optional[str] = None,
    date_str: Optional[str] = None,
    current_user_id: Optional[str] = None,
    ip_address: Optional[str] = None,
) -> List[Appointment]:
    query = db.query(Appointment)
    if doctor_id:
        query = query.filter(Appointment.doctor_id == doctor_id)
    if patient_id:
        query = query.filter(Appointment.patient_id == patient_id)
    if date_str:
        try:
            target_date = datetime.strptime(date_str, "%Y-%m-%d").date()
            start_dt = datetime.combine(target_date, time.min)
            end_dt = datetime.combine(target_date, time.max)
            query = query.filter(
                Appointment.appointment_time >= start_dt,
                Appointment.appointment_time <= end_dt,
            )
        except ValueError:
            pass

    appointments = (
        query.order_by(Appointment.appointment_time.asc())
        .offset(skip)
        .limit(limit)
        .all()
    )

    log_audit(
        db=db,
        action="QUERY_APPOINTMENTS",
        entity_type="Appointment",
        user_id=current_user_id,
        details={"count": len(appointments)},
        ip_address=ip_address,
    )

    return appointments


def get_appointment_by_id(
    db: Session,
    appt_id: str,
    current_user_id: Optional[str] = None,
    ip_address: Optional[str] = None,
) -> Optional[Appointment]:
    appt = db.query(Appointment).filter(Appointment.id == appt_id).first()
    if not appt:
        return None

    log_audit(
        db=db,
        action="VIEW_APPOINTMENT",
        entity_type="Appointment",
        entity_id=appt.id,
        user_id=current_user_id,
        ip_address=ip_address,
    )
    return appt


def update_appointment_status(
    db: Session,
    appt_id: str,
    new_status: str,
    current_user_id: Optional[str] = None,
    ip_address: Optional[str] = None,
) -> Appointment:
    appt = db.query(Appointment).filter(Appointment.id == appt_id).first()
    if not appt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Appointment with ID '{appt_id}' not found.",
        )

    valid_statuses = ["SCHEDULED", "CONFIRMED", "CANCELLED", "COMPLETED"]
    if new_status.upper() not in valid_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status '{new_status}'. Allowed values: {valid_statuses}",
        )

    old_status = appt.status
    appt.status = new_status.upper()
    db.commit()
    db.refresh(appt)

    log_audit(
        db=db,
        action="UPDATE_APPOINTMENT_STATUS",
        entity_type="Appointment",
        entity_id=appt.id,
        user_id=current_user_id,
        details={"old_status": old_status, "new_status": appt.status},
        ip_address=ip_address,
    )

    return appt


def get_doctor_availability(
    db: Session,
    doctor_id: str,
    date_str: str,
) -> DoctorAvailabilityResponse:
    doctor = db.query(Doctor).filter(Doctor.id == doctor_id).first()
    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Doctor with ID '{doctor_id}' not found.",
        )

    try:
        target_date = datetime.strptime(date_str, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid date format. Expected YYYY-MM-DD.",
        )

    # Fetch existing appointments for the doctor on target_date
    start_dt = datetime.combine(target_date, time.min)
    end_dt = datetime.combine(target_date, time.max)
    booked_appts = (
        db.query(Appointment)
        .filter(
            Appointment.doctor_id == doctor_id,
            Appointment.appointment_time >= start_dt,
            Appointment.appointment_time <= end_dt,
            Appointment.status != "CANCELLED",
        )
        .all()
    )

    booked_times = {appt.appointment_time.strftime("%H:%M") for appt in booked_appts}

    # Generate 30 min slots from 09:00 to 17:00
    slots: List[TimeSlot] = []
    current_time = datetime.combine(target_date, time(9, 0))
    end_time = datetime.combine(target_date, time(17, 0))

    while current_time < end_time:
        slot_str = current_time.strftime("%H:%M")
        next_time = current_time + timedelta(minutes=30)
        next_str = next_time.strftime("%H:%M")
        is_avail = slot_str not in booked_times
        slots.append(
            TimeSlot(
                start_time=f"{date_str}T{slot_str}:00",
                end_time=f"{date_str}T{next_str}:00",
                is_available=is_avail,
            )
        )
        current_time = next_time

    return DoctorAvailabilityResponse(
        doctor_id=doctor.id,
        doctor_name=f"Dr. {doctor.first_name} {doctor.last_name}",
        specialty=doctor.specialty,
        department=doctor.department,
        date=date_str,
        available_slots=slots,
    )
