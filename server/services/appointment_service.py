import uuid
from datetime import datetime, timedelta, time
from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from server.models.appointment import Appointment
from server.models.doctor import Doctor
from server.models.patient import Patient
from server.schemas.appointment import AppointmentCreateRequest, AppointmentStatusUpdate, AppointmentResponse
from server.services.audit_service import AuditService

class AppointmentService:
    @staticmethod
    def generate_appointment_code(db: Session) -> str:
        count = db.query(Appointment).count()
        code = f"APT-{2001 + count}"
        while db.query(Appointment).filter(Appointment.appointment_code == code).first():
            count += 1
            code = f"APT-{2001 + count}"
        return code

    @staticmethod
    def create_appointment(
        db: Session,
        data: AppointmentCreateRequest,
        current_user_id: Optional[str] = None,
    ) -> Appointment:
        # 1. Validate Patient
        patient = db.query(Patient).filter(Patient.id == data.patient_id).first()
        if not patient:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Patient with id '{data.patient_id}' not found",
            )

        # 2. Validate Doctor
        doctor = db.query(Doctor).filter(Doctor.id == data.doctor_id).first()
        if not doctor:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Doctor with id '{data.doctor_id}' not found",
            )

        # 3. Resolve scheduled start & end
        sched_start = data.scheduled_start or data.scheduled_time
        if not sched_start:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="scheduled_start or scheduled_time is required",
            )

        # Convert to datetime if string or strip tzinfo for consistent comparison
        if isinstance(sched_start, str):
            try:
                sched_start = datetime.fromisoformat(sched_start.replace("Z", "+00:00"))
            except Exception:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid scheduled_start datetime format",
                )

        slot_mins = doctor.slot_duration_minutes or 30
        sched_end = data.scheduled_end
        if not sched_end:
            sched_end = sched_start + timedelta(minutes=slot_mins)
        elif isinstance(sched_end, str):
            sched_end = datetime.fromisoformat(sched_end.replace("Z", "+00:00"))

        # 4. Concurrency / Collision Check (Pessimistic check)
        # Check active appointments that overlap
        # SQLite/Postgres compatible query:
        overlap = (
            db.query(Appointment)
            .filter(
                Appointment.doctor_id == data.doctor_id,
                Appointment.status.in_(["PENDING", "CONFIRMED", "IN_PROGRESS"]),
                Appointment.scheduled_start < sched_end,
                Appointment.scheduled_end > sched_start,
            )
            .first()
        )

        if overlap:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Doctor is already booked for this slot",
            )

        # 5. Create Appointment
        code = AppointmentService.generate_appointment_code(db)
        appointment = Appointment(
            id=str(uuid.uuid4()),
            appointment_code=code,
            patient_id=data.patient_id,
            doctor_id=data.doctor_id,
            scheduled_start=sched_start,
            scheduled_end=sched_end,
            status="CONFIRMED",
            reason_for_visit=data.reason_for_visit,
            created_by=current_user_id,
        )
        db.add(appointment)
        db.commit()
        db.refresh(appointment)

        AuditService.log_event(
            db=db,
            action="BOOK_APPOINTMENT",
            resource_type="APPOINTMENT",
            resource_id=appointment.id,
            user_id=current_user_id,
            details={"appointment_code": appointment.appointment_code, "doctor_id": data.doctor_id},
        )
        return appointment

    @staticmethod
    def get_appointment_by_id(db: Session, appointment_id: str) -> Appointment:
        appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
        if not appointment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Appointment with id '{appointment_id}' not found",
            )
        return appointment

    @staticmethod
    def list_appointments(
        db: Session,
        doctor_id: Optional[str] = None,
        patient_id: Optional[str] = None,
        date: Optional[str] = None,
        status_filter: Optional[str] = None,
        skip: int = 0,
        limit: int = 50,
    ) -> List[AppointmentResponse]:
        query = db.query(Appointment)
        if doctor_id:
            query = query.filter(Appointment.doctor_id == doctor_id)
        if patient_id:
            query = query.filter(Appointment.patient_id == patient_id)
        if status_filter:
            query = query.filter(Appointment.status == status_filter.upper())
        if date:
            try:
                target_date = datetime.strptime(date, "%Y-%m-%d").date()
                start_of_day = datetime.combine(target_date, time.min)
                end_of_day = datetime.combine(target_date, time.max)
                query = query.filter(
                    Appointment.scheduled_start >= start_of_day,
                    Appointment.scheduled_start <= end_of_day,
                )
            except ValueError:
                pass

        appointments = query.order_by(Appointment.scheduled_start.desc()).offset(skip).limit(limit).all()
        results = []
        for apt in appointments:
            p_name = f"{apt.patient.first_name} {apt.patient.last_name}" if apt.patient else None
            d_name = apt.doctor.user.full_name if (apt.doctor and apt.doctor.user) else None
            res = AppointmentResponse(
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
            results.append(res)
        return results

    @staticmethod
    def update_status(
        db: Session,
        appointment_id: str,
        data: AppointmentStatusUpdate,
        current_user_id: Optional[str] = None,
    ) -> Appointment:
        appointment = AppointmentService.get_appointment_by_id(db, appointment_id)
        valid_statuses = ["PENDING", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED"]
        new_status = data.status.upper()
        if new_status not in valid_statuses:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid status '{data.status}'. Allowed values: {valid_statuses}",
            )
        appointment.status = new_status
        if data.cancellation_reason:
            appointment.cancellation_reason = data.cancellation_reason
        db.commit()
        db.refresh(appointment)

        AuditService.log_event(
            db=db,
            action="UPDATE_APPOINTMENT_STATUS",
            resource_type="APPOINTMENT",
            resource_id=appointment.id,
            user_id=current_user_id,
            details={"new_status": new_status, "reason": data.cancellation_reason},
        )
        return appointment
