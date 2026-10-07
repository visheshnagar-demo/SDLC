import uuid
from datetime import datetime, time, timedelta, timezone
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.orm import Session

from server.database import get_db
from server.models import User, Patient, Doctor, Appointment
from server.schemas import (
    AppointmentSlot,
    AppointmentCreate,
    AppointmentStatusUpdate,
    AppointmentResponse,
)
from server.dependencies import get_current_user, record_audit

router = APIRouter(prefix="/api/v1/appointments", tags=["Appointment Scheduling"])


@router.get("/slots", response_model=List[AppointmentSlot])
def get_appointment_slots(
    doctor_id: str = Query(..., description="ID of the doctor"),
    date: str = Query(..., description="Date for consultation (YYYY-MM-DD)"),
    db: Session = Depends(get_db),
):
    # Lookup doctor
    doctor = db.query(Doctor).filter(Doctor.id == doctor_id).first()
    if not doctor:
        doctor = db.query(Doctor).filter(Doctor.user_id == doctor_id).first()

    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Doctor with id {doctor_id} not found.",
        )

    try:
        # Parse date string
        if "T" in date:
            target_date = datetime.fromisoformat(date.replace("Z", "+00:00")).date()
        else:
            target_date = datetime.strptime(date, "%Y-%m-%d").date()
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid date format. Expected YYYY-MM-DD.",
        )

    # Standard clinic operating hours: 09:00 to 17:00
    slot_minutes = doctor.slot_duration_minutes or 30
    start_dt = datetime.combine(target_date, time(9, 0), tzinfo=timezone.utc)
    end_dt = datetime.combine(target_date, time(17, 0), tzinfo=timezone.utc)

    # Fetch booked appointments for this doctor on this day
    day_start = datetime.combine(target_date, time(0, 0), tzinfo=timezone.utc)
    day_end = datetime.combine(target_date, time(23, 59, 59), tzinfo=timezone.utc)

    existing_appts = (
        db.query(Appointment)
        .filter(
            Appointment.doctor_id == doctor.id,
            Appointment.status != "CANCELLED",
            Appointment.start_time >= day_start,
            Appointment.start_time <= day_end,
        )
        .all()
    )

    slots: List[AppointmentSlot] = []
    current_slot_start = start_dt
    while current_slot_start + timedelta(minutes=slot_minutes) <= end_dt:
        current_slot_end = current_slot_start + timedelta(minutes=slot_minutes)

        # Check collision with existing active appointments
        is_booked = any(
            (
                (
                    appt.start_time.tzinfo is None
                    and appt.start_time.replace(tzinfo=timezone.utc) < current_slot_end
                )
                or (
                    appt.start_time.tzinfo is not None
                    and appt.start_time < current_slot_end
                )
            )
            and (
                (
                    appt.end_time.tzinfo is None
                    and appt.end_time.replace(tzinfo=timezone.utc) > current_slot_start
                )
                or (
                    appt.end_time.tzinfo is not None
                    and appt.end_time > current_slot_start
                )
            )
            for appt in existing_appts
        )

        slots.append(
            AppointmentSlot(
                slot_start=current_slot_start,
                slot_end=current_slot_end,
                is_available=not is_booked and doctor.is_available,
            )
        )
        current_slot_start = current_slot_end

    return slots


@router.post(
    "", response_model=AppointmentResponse, status_code=status.HTTP_201_CREATED
)
def book_appointment(
    appt_in: AppointmentCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Lookup doctor
    doctor = db.query(Doctor).filter(Doctor.id == appt_in.doctor_id).first()
    if not doctor:
        doctor = db.query(Doctor).filter(Doctor.user_id == appt_in.doctor_id).first()

    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Doctor with id {appt_in.doctor_id} not found.",
        )

    # Lookup patient
    patient = db.query(Patient).filter(Patient.id == appt_in.patient_id).first()
    if not patient:
        patient = (
            db.query(Patient).filter(Patient.user_id == appt_in.patient_id).first()
        )

    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient with id {appt_in.patient_id} not found.",
        )

    # RBAC check: Patient can only book for themselves unless staff
    if current_user.role == "PATIENT" and patient.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. You can only book appointments for your own patient profile.",
        )

    # Compute end_time if not provided
    start_time = appt_in.start_time
    if start_time.tzinfo is None:
        start_time = start_time.replace(tzinfo=timezone.utc)

    if appt_in.end_time:
        end_time = appt_in.end_time
        if end_time.tzinfo is None:
            end_time = end_time.replace(tzinfo=timezone.utc)
    else:
        slot_minutes = doctor.slot_duration_minutes or 30
        end_time = start_time + timedelta(minutes=slot_minutes)

    # Strict Pessimistic / Conflict Check:
    # Check if overlapping appointment exists for this doctor
    overlap = (
        db.query(Appointment)
        .filter(
            Appointment.doctor_id == doctor.id,
            Appointment.status != "CANCELLED",
            Appointment.start_time < end_time,
            Appointment.end_time > start_time,
        )
        .first()
    )

    if overlap:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="The requested consultation slot is already booked or conflicts with another appointment.",
        )

    new_appt = Appointment(
        id=str(uuid.uuid4()),
        patient_id=patient.id,
        doctor_id=doctor.id,
        start_time=start_time,
        end_time=end_time,
        status="SCHEDULED",
        reason=appt_in.reason,
    )
    db.add(new_appt)
    db.commit()
    db.refresh(new_appt)

    client_ip = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")
    record_audit(
        db=db,
        action="BOOK_APPOINTMENT",
        resource_type="APPOINTMENT",
        resource_id=new_appt.id,
        user_id=current_user.id,
        ip_address=client_ip,
        user_agent=user_agent,
        details={
            "patient_id": patient.id,
            "doctor_id": doctor.id,
            "start_time": start_time.isoformat(),
        },
    )

    return new_appt


@router.patch("/{appointment_id}/status", response_model=AppointmentResponse)
def update_appointment_status(
    appointment_id: str,
    status_in: AppointmentStatusUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    appt = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Appointment with id {appointment_id} not found.",
        )

    allowed_statuses = ["SCHEDULED", "CHECKED_IN", "COMPLETED", "CANCELLED"]
    target_status = status_in.status.upper()
    if target_status not in allowed_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid appointment status: {status_in.status}. Allowed: {', '.join(allowed_statuses)}",
        )

    # Check RBAC
    if current_user.role == "PATIENT":
        # Patients can only cancel their own appointments
        patient = db.query(Patient).filter(Patient.id == appt.patient_id).first()
        if not patient or patient.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied. You do not own this appointment.",
            )
        if target_status != "CANCELLED":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Patients are only permitted to cancel scheduled appointments.",
            )

    appt.status = target_status
    if status_in.cancellation_reason:
        appt.cancellation_reason = status_in.cancellation_reason

    db.commit()
    db.refresh(appt)

    client_ip = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")
    record_audit(
        db=db,
        action="UPDATE_APPOINTMENT_STATUS",
        resource_type="APPOINTMENT",
        resource_id=appt.id,
        user_id=current_user.id,
        ip_address=client_ip,
        user_agent=user_agent,
        details={"new_status": target_status, "reason": status_in.cancellation_reason},
    )

    return appt


@router.get("", response_model=List[AppointmentResponse])
def list_appointments(
    patient_id: Optional[str] = None,
    doctor_id: Optional[str] = None,
    status: Optional[str] = None,
    date: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Appointment)

    # RBAC filtering
    if current_user.role == "PATIENT":
        # Force filter to patient's own profile
        patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
        if not patient:
            return []
        query = query.filter(Appointment.patient_id == patient.id)
    elif patient_id:
        query = query.filter(Appointment.patient_id == patient_id)

    if doctor_id:
        query = query.filter(Appointment.doctor_id == doctor_id)

    if status:
        query = query.filter(Appointment.status == status.upper())

    if date:
        try:
            target_date = datetime.strptime(date, "%Y-%m-%d").date()
            day_start = datetime.combine(target_date, time(0, 0), tzinfo=timezone.utc)
            day_end = datetime.combine(
                target_date, time(23, 59, 59), tzinfo=timezone.utc
            )
            query = query.filter(
                Appointment.start_time >= day_start, Appointment.start_time <= day_end
            )
        except Exception:
            pass

    appts = query.order_by(Appointment.start_time.asc()).offset(skip).limit(limit).all()
    return appts


@router.get("/{appointment_id}", response_model=AppointmentResponse)
def get_appointment(
    appointment_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    appt = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Appointment with id {appointment_id} not found.",
        )

    if current_user.role == "PATIENT":
        patient = db.query(Patient).filter(Patient.id == appt.patient_id).first()
        if not patient or patient.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied. You can only view your own appointments.",
            )

    return appt
