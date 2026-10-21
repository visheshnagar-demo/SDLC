import uuid
from typing import Optional, Tuple, List
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc

from server.models import Patient, User
from server.schemas.patient import PatientCreateRequest, PatientUpdateRequest
from server.services.audit_service import log_action


def generate_patient_code(db: Session) -> str:
    last_patient = db.query(Patient).order_by(desc(Patient.created_at)).first()
    if not last_patient or not last_patient.patient_code.startswith("PAT-"):
        count = db.query(Patient).count()
        return f"PAT-{1001 + count}"
    try:
        num = int(last_patient.patient_code.replace("PAT-", "")) + 1
        return f"PAT-{num}"
    except ValueError:
        count = db.query(Patient).count()
        return f"PAT-{1001 + count}"


def create_patient(
    db: Session,
    patient_in: PatientCreateRequest,
    current_user: Optional[User] = None,
) -> Patient:
    patient_code = generate_patient_code(db)
    patient = Patient(
        id=str(uuid.uuid4()),
        user_id=current_user.id
        if current_user and current_user.role == "PATIENT"
        else None,
        patient_code=patient_code,
        first_name=patient_in.first_name,
        last_name=patient_in.last_name,
        date_of_birth=patient_in.date_of_birth,
        gender=patient_in.gender,
        phone_number=patient_in.phone_number,
        email=str(patient_in.email) if patient_in.email else None,
        address=patient_in.address,
        emergency_contact_name=patient_in.emergency_contact_name,
        emergency_contact_phone=patient_in.emergency_contact_phone,
        insurance_provider=patient_in.insurance_provider,
        insurance_policy_number=patient_in.insurance_policy_number,
    )
    db.add(patient)
    db.commit()
    db.refresh(patient)

    log_action(
        db,
        action="REGISTER_PATIENT",
        resource_type="PATIENT",
        resource_id=patient.id,
        user_id=current_user.id if current_user else None,
        details={
            "patient_code": patient_code,
            "name": f"{patient.first_name} {patient.last_name}",
        },
    )
    return patient


def update_patient(
    db: Session,
    patient_id: str,
    patient_in: PatientUpdateRequest,
    current_user: Optional[User] = None,
) -> Patient:
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found",
        )

    update_data = patient_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        if field == "email" and value:
            value = str(value)
        setattr(patient, field, value)

    db.commit()
    db.refresh(patient)

    log_action(
        db,
        action="UPDATE_PATIENT",
        resource_type="PATIENT",
        resource_id=patient.id,
        user_id=current_user.id if current_user else None,
        details=update_data,
    )
    return patient


def get_patient_by_id(
    db: Session,
    patient_id: str,
    current_user: Optional[User] = None,
) -> Patient:
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found",
        )

    log_action(
        db,
        action="VIEW_PATIENT",
        resource_type="PATIENT",
        resource_id=patient.id,
        user_id=current_user.id if current_user else None,
    )
    return patient


def list_patients(
    db: Session,
    skip: int = 0,
    limit: int = 20,
    search: Optional[str] = None,
    current_user: Optional[User] = None,
) -> Tuple[List[Patient], int]:
    query = db.query(Patient)
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            or_(
                Patient.first_name.ilike(search_filter),
                Patient.last_name.ilike(search_filter),
                Patient.patient_code.ilike(search_filter),
                Patient.phone_number.ilike(search_filter),
                Patient.email.ilike(search_filter),
                Patient.insurance_policy_number.ilike(search_filter),
            )
        )
    total = query.count()
    items = query.order_by(desc(Patient.created_at)).offset(skip).limit(limit).all()

    log_action(
        db,
        action="LIST_PATIENTS",
        resource_type="PATIENT",
        resource_id="ALL",
        user_id=current_user.id if current_user else None,
        details={"search": search, "skip": skip, "limit": limit, "count": len(items)},
    )
    return items, total
