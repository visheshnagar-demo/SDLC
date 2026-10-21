import uuid
from datetime import date, datetime, time, timedelta
from typing import Optional, List
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from server.models import Doctor, DoctorSchedule, Appointment, User
from server.schemas.doctor import (
    ScheduleCreateRequest,
    TimeSlot,
    DoctorAvailabilityResponse,
)
from server.services.audit_service import log_action


def list_doctors(
    db: Session,
    department: Optional[str] = None,
    is_available: Optional[bool] = None,
) -> List[Doctor]:
    query = db.query(Doctor)
    if department:
        query = query.filter(Doctor.department.ilike(f"%{department}%"))
    if is_available is not None:
        query = query.filter(Doctor.is_available == is_available)
    return query.all()


def get_doctor_by_id(db: Session, doctor_id: str) -> Doctor:
    doctor = db.query(Doctor).filter(Doctor.id == doctor_id).first()
    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor not found",
        )
    return doctor


def configure_doctor_schedule(
    db: Session,
    doctor_id: str,
    schedule_in: ScheduleCreateRequest,
    current_user: Optional[User] = None,
) -> DoctorSchedule:
    doctor = get_doctor_by_id(db, doctor_id)

    # Permission check: admin or the doctor themselves
    if (
        current_user
        and current_user.role != "ADMIN"
        and doctor.user_id != current_user.id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to configure schedules for this doctor",
        )

    # Check for existing schedule on this day
    existing = (
        db.query(DoctorSchedule)
        .filter(
            DoctorSchedule.doctor_id == doctor_id,
            DoctorSchedule.day_of_week == schedule_in.day_of_week,
        )
        .first()
    )

    if existing:
        existing.start_time = schedule_in.start_time
        existing.end_time = schedule_in.end_time
        existing.is_active = (
            schedule_in.is_active if schedule_in.is_active is not None else True
        )
        db.commit()
        db.refresh(existing)
        schedule = existing
    else:
        schedule = DoctorSchedule(
            id=str(uuid.uuid4()),
            doctor_id=doctor_id,
            day_of_week=schedule_in.day_of_week,
            start_time=schedule_in.start_time,
            end_time=schedule_in.end_time,
            is_active=schedule_in.is_active
            if schedule_in.is_active is not None
            else True,
        )
        db.add(schedule)
        db.commit()
        db.refresh(schedule)

    log_action(
        db,
        action="CONFIGURE_SCHEDULE",
        resource_type="DOCTOR_SCHEDULE",
        resource_id=schedule.id,
        user_id=current_user.id if current_user else None,
        details={
            "doctor_id": doctor_id,
            "day_of_week": schedule_in.day_of_week,
            "start": str(schedule_in.start_time),
            "end": str(schedule_in.end_time),
        },
    )
    return schedule


def get_doctor_availability(
    db: Session,
    doctor_id: str,
    target_date: date,
) -> DoctorAvailabilityResponse:
    doctor = get_doctor_by_id(db, doctor_id)
    if not doctor.is_available:
        return DoctorAvailabilityResponse(
            doctor_id=doctor_id,
            date=target_date,
            slot_duration_minutes=doctor.slot_duration_minutes,
            available_slots=[],
        )

    day_of_week = target_date.weekday()  # 0 is Monday, 6 is Sunday
    schedules = (
        db.query(DoctorSchedule)
        .filter(
            DoctorSchedule.doctor_id == doctor_id,
            DoctorSchedule.day_of_week == day_of_week,
            DoctorSchedule.is_active == True,
        )
        .all()
    )

    if not schedules:
        return DoctorAvailabilityResponse(
            doctor_id=doctor_id,
            date=target_date,
            slot_duration_minutes=doctor.slot_duration_minutes,
            available_slots=[],
        )

    # Fetch existing active appointments for that date
    day_start = datetime.combine(target_date, time.min)
    day_end = datetime.combine(target_date, time.max)

    booked_appointments = (
        db.query(Appointment)
        .filter(
            Appointment.doctor_id == doctor_id,
            Appointment.scheduled_start >= day_start,
            Appointment.scheduled_start <= day_end,
            Appointment.status.in_(["PENDING", "CONFIRMED", "IN_PROGRESS"]),
        )
        .all()
    )

    booked_ranges = [
        (appt.scheduled_start, appt.scheduled_end) for appt in booked_appointments
    ]

    slot_duration = timedelta(minutes=doctor.slot_duration_minutes or 30)
    slots: List[TimeSlot] = []

    for sched in schedules:
        current_time = datetime.combine(target_date, sched.start_time)
        shift_end = datetime.combine(target_date, sched.end_time)

        while current_time + slot_duration <= shift_end:
            slot_start = current_time
            slot_end = current_time + slot_duration

            # Check overlap
            is_booked = any(
                (slot_start < b_end and slot_end > b_start)
                for b_start, b_end in booked_ranges
            )

            slots.append(
                TimeSlot(
                    start_time=slot_start.strftime("%H:%M:%S"),
                    end_time=slot_end.strftime("%H:%M:%S"),
                    is_available=not is_booked,
                )
            )
            current_time += slot_duration

    return DoctorAvailabilityResponse(
        doctor_id=doctor_id,
        date=target_date,
        slot_duration_minutes=doctor.slot_duration_minutes,
        available_slots=slots,
    )
