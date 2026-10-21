import uuid
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from server.models import ClinicalRecord, Appointment, Doctor, User
from server.schemas.clinical_record import ClinicalRecordCreateRequest
from server.services.audit_service import log_action


def create_clinical_record(
    db: Session,
    appointment_id: str,
    record_in: ClinicalRecordCreateRequest,
    current_user: User,
) -> ClinicalRecord:
    # 1. Fetch appointment
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found",
        )

    # 2. RBAC: Only assigned doctor or admin can write clinical records
    user_role = (current_user.role or "").upper()
    if user_role not in ["DOCTOR", "ADMIN"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only healthcare providers (Doctors) can create clinical consultation records",
        )

    if user_role == "DOCTOR":
        doctor = db.query(Doctor).filter(Doctor.user_id == current_user.id).first()
        if doctor and appointment.doctor_id != doctor.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only the assigned physician can record clinical notes for this encounter",
            )

    # 3. Check if clinical record already exists for this appointment
    existing = (
        db.query(ClinicalRecord)
        .filter(ClinicalRecord.appointment_id == appointment_id)
        .first()
    )
    if existing:
        existing.symptoms = record_in.symptoms
        existing.diagnosis = record_in.diagnosis
        existing.prescription = record_in.prescription
        existing.notes = record_in.notes
        existing.follow_up_date = record_in.follow_up_date
        db.commit()
        db.refresh(existing)
        clinical_rec = existing
    else:
        clinical_rec = ClinicalRecord(
            id=str(uuid.uuid4()),
            appointment_id=appointment.id,
            patient_id=appointment.patient_id,
            doctor_id=appointment.doctor_id,
            symptoms=record_in.symptoms,
            diagnosis=record_in.diagnosis,
            prescription=record_in.prescription,
            notes=record_in.notes,
            follow_up_date=record_in.follow_up_date,
        )
        db.add(clinical_rec)
        db.commit()
        db.refresh(clinical_rec)

    # Transition appointment to COMPLETED
    appointment.status = "COMPLETED"
    db.commit()

    log_action(
        db,
        action="CREATE_CLINICAL_RECORD",
        resource_type="CLINICAL_RECORD",
        resource_id=clinical_rec.id,
        user_id=current_user.id,
        details={
            "appointment_id": appointment_id,
            "patient_id": appointment.patient_id,
            "doctor_id": appointment.doctor_id,
            "diagnosis": record_in.diagnosis,
        },
    )
    return clinical_rec


def get_clinical_record(
    db: Session,
    appointment_id: str,
    current_user: User,
) -> ClinicalRecord:
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found",
        )

    # RBAC: Receptionists are explicitly blocked from viewing sensitive clinical records
    user_role = (current_user.role or "").upper()
    if user_role == "RECEPTIONIST":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Receptionist role is not authorized to view clinical diagnosis or prescriptions",
        )

    record = (
        db.query(ClinicalRecord)
        .filter(ClinicalRecord.appointment_id == appointment_id)
        .first()
    )
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No clinical record found for this appointment",
        )

    log_action(
        db,
        action="VIEW_CLINICAL_RECORD",
        resource_type="CLINICAL_RECORD",
        resource_id=record.id,
        user_id=current_user.id,
        details={"appointment_id": appointment_id, "patient_id": record.patient_id},
    )
    return record
