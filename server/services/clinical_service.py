import uuid
from typing import Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from server.models.appointment import Appointment
from server.models.clinical_record import ClinicalRecord
from server.schemas.clinical_record import ClinicalRecordCreateRequest, ClinicalRecordResponse
from server.services.audit_service import AuditService

class ClinicalService:
    @staticmethod
    def create_record(
        db: Session,
        appointment_id: str,
        data: ClinicalRecordCreateRequest,
        current_user_id: Optional[str] = None,
    ) -> ClinicalRecord:
        appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
        if not appointment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Appointment with id '{appointment_id}' not found",
            )

        existing_record = db.query(ClinicalRecord).filter(ClinicalRecord.appointment_id == appointment_id).first()
        if existing_record:
            existing_record.symptoms = data.symptoms
            existing_record.diagnosis = data.diagnosis
            existing_record.prescription = data.prescription
            existing_record.notes = data.notes
            existing_record.follow_up_date = data.follow_up_date
            record = existing_record
        else:
            record = ClinicalRecord(
                id=str(uuid.uuid4()),
                appointment_id=appointment_id,
                patient_id=appointment.patient_id,
                doctor_id=appointment.doctor_id,
                symptoms=data.symptoms,
                diagnosis=data.diagnosis,
                prescription=data.prescription,
                notes=data.notes,
                follow_up_date=data.follow_up_date,
            )
            db.add(record)

        # Transition appointment status to COMPLETED
        appointment.status = "COMPLETED"

        db.commit()
        db.refresh(record)

        AuditService.log_event(
            db=db,
            action="CREATE_CLINICAL_RECORD",
            resource_type="CLINICAL_RECORD",
            resource_id=record.id,
            user_id=current_user_id,
            details={"appointment_id": appointment_id, "diagnosis": record.diagnosis},
        )
        return record

    @staticmethod
    def get_record(
        db: Session,
        appointment_id: str,
        current_user_id: Optional[str] = None,
    ) -> ClinicalRecord:
        appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
        if not appointment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Appointment with id '{appointment_id}' not found",
            )

        record = db.query(ClinicalRecord).filter(ClinicalRecord.appointment_id == appointment_id).first()
        if not record:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No clinical record found for appointment '{appointment_id}'",
            )

        AuditService.log_event(
            db=db,
            action="VIEW_CLINICAL_RECORD",
            resource_type="CLINICAL_RECORD",
            resource_id=record.id,
            user_id=current_user_id,
        )
        return record
