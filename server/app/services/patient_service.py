import json
import uuid
from typing import Any, Dict, List, Optional
from fastapi import HTTPException, status
from sqlalchemy import or_
from sqlalchemy.orm import Session
from server.app.models.patient import Patient
from server.app.schemas.patient import PatientCreate, PatientUpdate
from server.app.services.audit_service import log_audit


def _serialize_dict(data: Any) -> str:
    if isinstance(data, dict):
        return json.dumps(data)
    if hasattr(data, "model_dump"):
        return json.dumps(data.model_dump())
    if hasattr(data, "dict"):
        return json.dumps(data.dict())
    return json.dumps({})


def _deserialize_dict(data_str: Optional[str]) -> Dict[str, Any]:
    if not data_str:
        return {}
    try:
        return json.loads(data_str)
    except Exception:
        return {}


def create_patient(
    db: Session,
    patient_in: PatientCreate,
    current_user_id: Optional[str] = None,
    ip_address: Optional[str] = None,
) -> Patient:
    # Check duplicate national_id / SSN
    existing = (
        db.query(Patient).filter(Patient.national_id == patient_in.national_id).first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Patient with National ID / SSN '{patient_in.national_id}' already exists. Please review existing profiles.",
        )

    patient_id = str(uuid.uuid4())
    emergency_contact_json = _serialize_dict(patient_in.emergency_contact)
    insurance_info_json = (
        _serialize_dict(patient_in.insurance_info)
        if patient_in.insurance_info
        else None
    )

    patient = Patient(
        id=patient_id,
        user_id=patient_in.user_id,
        first_name=patient_in.first_name,
        last_name=patient_in.last_name,
        date_of_birth=patient_in.date_of_birth,
        gender=patient_in.gender,
        national_id=patient_in.national_id,
        phone=patient_in.phone,
        address=patient_in.address,
        emergency_contact=emergency_contact_json,
        insurance_info=insurance_info_json,
    )
    db.add(patient)
    db.commit()
    db.refresh(patient)

    log_audit(
        db=db,
        action="REGISTER_PATIENT",
        entity_type="Patient",
        entity_id=patient.id,
        user_id=current_user_id,
        details={
            "name": f"{patient.first_name} {patient.last_name}",
            "national_id": patient.national_id,
        },
        ip_address=ip_address,
    )

    return patient


def get_patients(
    db: Session,
    skip: int = 0,
    limit: int = 20,
    search: Optional[str] = None,
    current_user_id: Optional[str] = None,
    ip_address: Optional[str] = None,
) -> List[Patient]:
    query = db.query(Patient)
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            or_(
                Patient.first_name.ilike(search_filter),
                Patient.last_name.ilike(search_filter),
                Patient.national_id.ilike(search_filter),
                Patient.phone.ilike(search_filter),
            )
        )

    patients = query.order_by(Patient.created_at.desc()).offset(skip).limit(limit).all()

    log_audit(
        db=db,
        action="QUERY_PATIENTS",
        entity_type="Patient",
        user_id=current_user_id,
        details={"search": search, "count": len(patients)},
        ip_address=ip_address,
    )

    return patients


def get_patient_by_id(
    db: Session,
    patient_id: str,
    current_user_id: Optional[str] = None,
    ip_address: Optional[str] = None,
) -> Optional[Patient]:
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        return None

    log_audit(
        db=db,
        action="VIEW_PATIENT",
        entity_type="Patient",
        entity_id=patient.id,
        user_id=current_user_id,
        ip_address=ip_address,
    )
    return patient


def update_patient(
    db: Session,
    patient_id: str,
    patient_update: PatientUpdate,
    current_user_id: Optional[str] = None,
    ip_address: Optional[str] = None,
) -> Patient:
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient with ID '{patient_id}' not found.",
        )

    update_data = patient_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if field in ("emergency_contact", "insurance_info") and value is not None:
            setattr(patient, field, _serialize_dict(value))
        elif value is not None:
            setattr(patient, field, value)

    db.commit()
    db.refresh(patient)

    log_audit(
        db=db,
        action="UPDATE_PATIENT",
        entity_type="Patient",
        entity_id=patient.id,
        user_id=current_user_id,
        details={"updated_fields": list(update_data.keys())},
        ip_address=ip_address,
    )

    return patient
