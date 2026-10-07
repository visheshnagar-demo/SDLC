import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.orm import Session
from sqlalchemy import or_

from server.database import get_db
from server.models import User, Patient
from server.schemas import (
    PatientCreate,
    PatientUpdate,
    PatientResponse,
    PatientListResponse,
)
from server.dependencies import get_current_user, record_audit

router = APIRouter(prefix="/api/v1/patients", tags=["Patient Management"])


@router.post("", response_model=PatientResponse, status_code=status.HTTP_201_CREATED)
def create_patient(
    patient_in: PatientCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Determine target user_id
    target_user_id = patient_in.user_id
    if not target_user_id:
        target_user_id = current_user.id
    elif target_user_id != current_user.id and current_user.role not in [
        "ADMIN",
        "RECEPTIONIST",
    ]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to create a patient profile for another user.",
        )

    # Check target user exists
    target_user = db.query(User).filter(User.id == target_user_id).first()
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with id {target_user_id} not found.",
        )

    # Check duplicate patient profile for user
    existing_user_profile = (
        db.query(Patient).filter(Patient.user_id == target_user_id).first()
    )
    if existing_user_profile:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A patient profile already exists for this user account.",
        )

    # Check duplicate national_id / SSN
    existing_nid = (
        db.query(Patient).filter(Patient.national_id == patient_in.national_id).first()
    )
    if existing_nid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Duplicate National ID / SSN. A patient with this identifier already exists.",
        )

    dob = patient_in.date_of_birth or patient_in.dob
    if not dob:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Date of birth is required.",
        )

    new_patient = Patient(
        id=str(uuid.uuid4()),
        user_id=target_user_id,
        national_id=patient_in.national_id,
        date_of_birth=dob,
        gender=patient_in.gender,
        blood_group=patient_in.blood_group,
        address=patient_in.address,
        emergency_contact_name=patient_in.emergency_contact_name,
        emergency_contact_phone=patient_in.emergency_contact_phone,
        insurance_provider=patient_in.insurance_provider,
        insurance_policy_number=patient_in.insurance_policy_number,
    )
    db.add(new_patient)
    db.commit()
    db.refresh(new_patient)

    client_ip = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")
    record_audit(
        db=db,
        action="CREATE_PATIENT",
        resource_type="PATIENT",
        resource_id=new_patient.id,
        user_id=current_user.id,
        ip_address=client_ip,
        user_agent=user_agent,
        details={"national_id": new_patient.national_id, "patient_id": new_patient.id},
    )

    return new_patient


@router.get("", response_model=PatientListResponse)
def list_patients(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    national_id: Optional[str] = None,
    request: Request = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role not in ["ADMIN", "DOCTOR", "NURSE", "RECEPTIONIST"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access restricted to clinical and administrative staff.",
        )

    query = db.query(Patient).join(User, Patient.user_id == User.id)

    if national_id:
        query = query.filter(Patient.national_id.ilike(f"%{national_id}%"))

    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            or_(
                User.full_name.ilike(search_pattern),
                User.email.ilike(search_pattern),
                Patient.national_id.ilike(search_pattern),
                Patient.insurance_provider.ilike(search_pattern),
            )
        )

    total = query.count()
    items = query.order_by(Patient.created_at.desc()).offset(skip).limit(limit).all()

    return PatientListResponse(total=total, items=items)


@router.get("/{patient_id}", response_model=PatientResponse)
def get_patient(
    patient_id: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        # Check by user_id as fallback
        patient = db.query(Patient).filter(Patient.user_id == patient_id).first()

    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient with id {patient_id} not found.",
        )

    # Check RBAC: Staff or owning patient
    if current_user.role == "PATIENT" and patient.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. You can only view your own patient profile.",
        )

    client_ip = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")
    record_audit(
        db=db,
        action="READ_PATIENT",
        resource_type="PATIENT",
        resource_id=patient.id,
        user_id=current_user.id,
        ip_address=client_ip,
        user_agent=user_agent,
    )

    return patient


@router.patch("/{patient_id}", response_model=PatientResponse)
def update_patient(
    patient_id: str,
    patient_in: PatientUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        patient = db.query(Patient).filter(Patient.user_id == patient_id).first()

    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient with id {patient_id} not found.",
        )

    if current_user.role == "PATIENT" and patient.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. You can only update your own profile.",
        )
    elif current_user.role not in ["ADMIN", "RECEPTIONIST", "PATIENT"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Unauthorized to update patient demographic records.",
        )

    for field, value in patient_in.model_dump(exclude_unset=True).items():
        if value is not None:
            setattr(patient, field, value)

    db.commit()
    db.refresh(patient)

    client_ip = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")
    record_audit(
        db=db,
        action="UPDATE_PATIENT",
        resource_type="PATIENT",
        resource_id=patient.id,
        user_id=current_user.id,
        ip_address=client_ip,
        user_agent=user_agent,
    )

    return patient
