import uuid
from datetime import datetime, time, timedelta
from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from server.models.doctor import Doctor, DoctorSchedule
from server.models.appointment import Appointment
from server.models.user import User
from server.schemas.doctor import ScheduleCreateRequest, DoctorResponse, DoctorAvailabilityResponse

class DoctorService:
    @staticmethod
    def list_doctors(db: Session, department: Optional[str] = None) -> List[DoctorResponse]:
        query = db.query(Doctor).join(User, Doctor.user_id == User.id)
        if department:
            query = query.filter(Doctor.department.ilike(f"%{department}%"))
        doctors = query.all()
        result = []
        for doc in doctors:
            res = DoctorResponse(
                id=doc.id,
                user_id=doc.user_id,
                doctor_code=doc.doctor_code,
                department=doc.department,
                qualification=doc.qualification,
                consultation_fee=doc.consultation_fee,
                slot_duration_minutes=doc.slot_duration_minutes,
                is_available=doc.is_available,
                full_name=doc.user.full_name if doc.user else f"Dr. {doc.doctor_code}",
                email=doc.user.email if doc.user else None,
                created_at=doc.created_at,
                updated_at=doc.updated_at,
            )
            result.append(res)
        return result

    @staticmethod
    def get_doctor_by_id(db: Session, doctor_id: str) -> Doctor:
        doctor = db.query(Doctor).filter(Doctor.id == doctor_id).first()
        if not doctor:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Doctor with id '{doctor_id}' not found",
            )
        return doctor

    @staticmethod
    def create_or_update_schedule(
        db: Session,
        doctor_id: str,
        data: ScheduleCreateRequest,
    ) -> DoctorSchedule:
        DoctorService.get_doctor_by_id(db, doctor_id)
        schedule = (
            db.query(DoctorSchedule)
            .filter(
                DoctorSchedule.doctor_id == doctor_id,
                DoctorSchedule.day_of_week == data.day_of_week,
            )
            .first()
        )
        if schedule:
            schedule.start_time = data.start_time
            schedule.end_time = data.end_time
            schedule.is_active = data.is_active
        else:
            schedule = DoctorSchedule(
                id=str(uuid.uuid4()),
                doctor_id=doctor_id,
                day_of_week=data.day_of_week,
                start_time=data.start_time,
                end_time=data.end_time,
                is_active=data.is_active,
            )
            db.add(schedule)
        db.commit()
        db.refresh(schedule)
        return schedule

    @staticmethod
    def get_availability(
        db: Session,
        doctor_id: str,
        date_str: str,
    ) -> DoctorAvailabilityResponse:
        doctor = DoctorService.get_doctor_by_id(db, doctor_id)
        try:
            target_date = datetime.strptime(date_str, "%Y-%m-%d").date()
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid date format. Expected YYYY-MM-DD",
            )

        day_of_week = target_date.weekday()  # 0=Monday, 6=Sunday
        schedules = (
            db.query(DoctorSchedule)
            .filter(
                DoctorSchedule.doctor_id == doctor_id,
                DoctorSchedule.day_of_week == day_of_week,
                DoctorSchedule.is_active == True,  # noqa: E712
            )
            .all()
        )

        start_h, start_m = 9, 0
        end_h, end_m = 17, 0
        if schedules:
            try:
                parts_start = schedules[0].start_time.split(":")
                start_h, start_m = int(parts_start[0]), int(parts_start[1])
                parts_end = schedules[0].end_time.split(":")
                end_h, end_m = int(parts_end[0]), int(parts_end[1])
            except Exception:
                pass

        slot_mins = doctor.slot_duration_minutes or 30
        current_time = datetime.combine(target_date, time(start_h, start_m))
        end_time = datetime.combine(target_date, time(end_h, end_m))

        # Query existing active appointments for doctor on this date
        start_of_day = datetime.combine(target_date, time.min)
        end_of_day = datetime.combine(target_date, time.max)
        booked_appointments = (
            db.query(Appointment)
            .filter(
                Appointment.doctor_id == doctor_id,
                Appointment.scheduled_start >= start_of_day,
                Appointment.scheduled_start <= end_of_day,
                Appointment.status.in_(["PENDING", "CONFIRMED", "IN_PROGRESS"]),
            )
            .all()
        )

        booked_start_times = set()
        for apt in booked_appointments:
            # Normalize to slot time string HH:MM
            slot_key = apt.scheduled_start.strftime("%H:%M")
            booked_start_times.add(slot_key)

        available_slots = []
        while current_time < end_time:
            time_str = current_time.strftime("%H:%M")
            if time_str not in booked_start_times:
                available_slots.append(time_str)
            current_time += timedelta(minutes=slot_mins)

        return DoctorAvailabilityResponse(
            doctor_id=doctor_id,
            date=date_str,
            available_slots=available_slots,
            slot_duration_minutes=slot_mins,
        )
