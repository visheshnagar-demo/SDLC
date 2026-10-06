import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from server.database import get_db
from server import models, schemas
from server.auth import get_optional_user

router = APIRouter(prefix="/api/v1/patients", tags=["Patients"])


@router.get("", response_model=List[schemas.PatientResponse])
def list_patients(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    query: Optional[str] = Query(None, alias="query"),
    search: Optional[str] = Query(None, alias="search"),
    db: Session = Depends(get_db),
):
    search_term = query or search
    q = db.query(models.Patient)
    if search_term:
        term = f"%{search_term.strip()}%"
        q = q.filter(
            or_(
                models.Patient.mrn.ilike(term),
                models.Patient.first_name.ilike(term),
                models.Patient.last_name.ilike(term),
                models.Patient.email.ilike(term),
                models.Patient.phone.ilike(term),
                models.Patient.insurance_policy_number.ilike(term),
            )
        )
    patients = (
        q.order_by(models.Patient.created_at.desc()).offset(skip).limit(limit).all()
    )
    return patients


@router.post(
    "", response_model=schemas.PatientResponse, status_code=status.HTTP_201_CREATED
)
def create_patient(
    patient_in: schemas.PatientCreate,
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_optional_user),
):
    mrn = patient_in.mrn
    if not mrn:
        mrn = f"MRN-{uuid.uuid4().hex[:6].upper()}"

    existing = db.query(models.Patient).filter(models.Patient.mrn == mrn).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Patient with MRN {mrn} already exists",
        )

    patient_id = str(uuid.uuid4())
    patient = models.Patient(
        id=patient_id,
        user_id=patient_in.user_id or (current_user.id if current_user else None),
        mrn=mrn,
        first_name=patient_in.first_name,
        last_name=patient_in.last_name,
        date_of_birth=patient_in.date_of_birth,
        gender=patient_in.gender,
        phone=patient_in.phone,
        email=patient_in.email,
        address=patient_in.address,
        emergency_contact_name=patient_in.emergency_contact_name,
        emergency_contact_phone=patient_in.emergency_contact_phone,
        emergency_contact_relationship=patient_in.emergency_contact_relationship,
        insurance_provider=patient_in.insurance_provider,
        insurance_policy_number=patient_in.insurance_policy_number,
        insurance_group_number=patient_in.insurance_group_number,
        insurance_status=patient_in.insurance_status or "Active",
        allergies=patient_in.allergies,
    )
    db.add(patient)

    # HIPAA audit log
    audit = models.AuditLog(
        id=str(uuid.uuid4()),
        user_id=current_user.id if current_user else None,
        action="CREATE_PATIENT",
        resource_type="Patient",
        resource_id=patient_id,
        details=f"Patient registered: {patient.first_name} {patient.last_name} (MRN: {mrn})",
    )
    db.add(audit)

    db.commit()
    db.refresh(patient)
    return patient


@router.get("/{id}", response_model=schemas.PatientResponse)
def get_patient(
    id: str,
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_optional_user),
):
    patient = (
        db.query(models.Patient)
        .filter(or_(models.Patient.id == id, models.Patient.mrn == id))
        .first()
    )
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient with ID/MRN {id} not found",
        )

    # HIPAA audit log for access
    audit = models.AuditLog(
        id=str(uuid.uuid4()),
        user_id=current_user.id if current_user else None,
        action="VIEW_PATIENT_PHI",
        resource_type="Patient",
        resource_id=patient.id,
        details=f"Patient record accessed: {patient.mrn}",
    )
    db.add(audit)
    db.commit()

    return patient


@router.put("/{id}", response_model=schemas.PatientResponse)
def update_patient(
    id: str,
    patient_update: schemas.PatientUpdate,
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_optional_user),
):
    patient = (
        db.query(models.Patient)
        .filter(or_(models.Patient.id == id, models.Patient.mrn == id))
        .first()
    )
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient with ID/MRN {id} not found",
        )

    update_data = (
        patient_update.dict(exclude_unset=True)
        if hasattr(patient_update, "dict")
        else patient_update.model_dump(exclude_unset=True)
    )
    for field, value in update_data.items():
        setattr(patient, field, value)

    audit = models.AuditLog(
        id=str(uuid.uuid4()),
        user_id=current_user.id if current_user else None,
        action="UPDATE_PATIENT",
        resource_type="Patient",
        resource_id=patient.id,
        details=f"Patient updated: {list(update_data.keys())}",
    )
    db.add(audit)

    db.commit()
    db.refresh(patient)
    return patient
