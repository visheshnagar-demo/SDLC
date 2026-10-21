import uuid
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import or_
from fastapi import HTTPException, status
from server.models.patient import Patient
from server.schemas.patient import PatientCreateRequest, PatientUpdateRequest
from server.services.audit_service import AuditService

class PatientService:
    @staticmethod
    def generate_patient_code(db: Session) -> str:
        count = db.query(Patient).count()
        code = f"PAT-{1001 + count}"
        while db.query(Patient).filter(Patient.patient_code == code).first():
            count += 1
            code = f"PAT-{1001 + count}"
        return code

    @staticmethod
    def create_patient(db: Session, data: PatientCreateRequest, current_user_id: Optional[str] = None) -> Patient:
        code = PatientService.generate_patient_code(db)
        patient = Patient(
            id=str(uuid.uuid4()),
            patient_code=code,
            first_name=data.first_name,
            last_name=data.last_name,
            date_of_birth=str(data.date_of_birth),
            gender=data.gender,
            phone_number=data.phone_number,
            email=data.email,
            address=data.address,
            emergency_contact_name=data.emergency_contact_name,
            emergency_contact_phone=data.emergency_contact_phone,
            insurance_provider=data.insurance_provider,
            insurance_policy_number=data.insurance_policy_number,
        )
        db.add(patient)
        db.commit()
        db.refresh(patient)

        AuditService.log_event(
            db=db,
            action="CREATE_PATIENT",
            resource_type="PATIENT",
            resource_id=patient.id,
            user_id=current_user_id,
            details={"patient_code": patient.patient_code, "name": f"{patient.first_name} {patient.last_name}"},
        )
        return patient

    @staticmethod
    def get_patient_by_id(db: Session, patient_id: str, current_user_id: Optional[str] = None) -> Patient:
        patient = db.query(Patient).filter(Patient.id == patient_id).first()
        if not patient:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Patient with id '{patient_id}' not found",
            )
        AuditService.log_event(
            db=db,
            action="VIEW_PATIENT",
            resource_type="PATIENT",
            resource_id=patient.id,
            user_id=current_user_id,
        )
        return patient

    @staticmethod
    def list_patients(
        db: Session,
        skip: int = 0,
        limit: int = 20,
        search: Optional[str] = None,
        current_user_id: Optional[str] = None,
    ) -> List[Patient]:
        query = db.query(Patient)
        if search:
            search_pattern = f"%{search}%"
            query = query.filter(
                or_(
                    Patient.first_name.ilike(search_pattern),
                    Patient.last_name.ilike(search_pattern),
                    Patient.patient_code.ilike(search_pattern),
                    Patient.phone_number.ilike(search_pattern),
                )
            )
        patients = query.offset(skip).limit(limit).all()
        return patients

    @staticmethod
    def update_patient(
        db: Session,
        patient_id: str,
        data: PatientUpdateRequest,
        current_user_id: Optional[str] = None,
    ) -> Patient:
        patient = PatientService.get_patient_by_id(db, patient_id)
        update_dict = data.model_dump(exclude_unset=True)
        for key, value in update_dict.items():
            if value is not None:
                setattr(patient, key, value)
        db.commit()
        db.refresh(patient)

        AuditService.log_event(
            db=db,
            action="UPDATE_PATIENT",
            resource_type="PATIENT",
            resource_id=patient.id,
            user_id=current_user_id,
            details=update_dict,
        )
        return patient
