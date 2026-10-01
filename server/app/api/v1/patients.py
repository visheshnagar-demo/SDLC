import json
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy.orm import Session
from server.app.api.deps import (
    get_client_ip,
    get_optional_current_user,
)
from server.app.core.database import get_db
from server.app.models.patient import Patient
from server.app.models.user import User
from server.app.schemas.patient import (
    PatientCreate,
    PatientResponse,
    PatientUpdate,
)
from server.app.services.patient_service import (
    create_patient,
    get_patient_by_id,
    get_patients,
    update_patient,
)

router = APIRouter(prefix="/patients", tags=["patients"])


def _format_patient_response(p: Patient) -> PatientResponse:
    em_contact: Dict[str, Any] = {}
    if p.emergency_contact:
        try:
            em_contact = json.loads(p.emergency_contact)
        except Exception:
            em_contact = {"raw": p.emergency_contact}

    ins_info: Optional[Dict[str, Any]] = None
    if p.insurance_info:
        try:
            ins_info = json.loads(p.insurance_info)
        except Exception:
            ins_info = {"raw": p.insurance_info}

    return PatientResponse(
        id=p.id,
        user_id=p.user_id,
        first_name=p.first_name,
        last_name=p.last_name,
        date_of_birth=p.date_of_birth,
        gender=p.gender,
        national_id=p.national_id,
        phone=p.phone,
        address=p.address,
        emergency_contact=em_contact,
        insurance_info=ins_info,
        created_at=p.created_at,
        updated_at=p.updated_at,
    )


@router.post("", response_model=PatientResponse, status_code=status.HTTP_201_CREATED)
def register_patient(
    patient_in: PatientCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    user_id = current_user.id if current_user else None
    patient = create_patient(
        db=db,
        patient_in=patient_in,
        current_user_id=user_id,
        ip_address=get_client_ip(request),
    )
    return _format_patient_response(patient)


@router.get("", response_model=List[PatientResponse])
def list_patients(
    request: Request,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    user_id = current_user.id if current_user else None
    patients = get_patients(
        db=db,
        skip=skip,
        limit=limit,
        search=search,
        current_user_id=user_id,
        ip_address=get_client_ip(request),
    )
    return [_format_patient_response(p) for p in patients]


@router.get("/{patient_id}", response_model=PatientResponse)
def get_patient(
    patient_id: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    user_id = current_user.id if current_user else None
    patient = get_patient_by_id(
        db=db,
        patient_id=patient_id,
        current_user_id=user_id,
        ip_address=get_client_ip(request),
    )
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient with ID '{patient_id}' not found.",
        )
    return _format_patient_response(patient)


@router.put("/{patient_id}", response_model=PatientResponse)
def update_patient_profile(
    patient_id: str,
    patient_update: PatientUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    user_id = current_user.id if current_user else None
    patient = update_patient(
        db=db,
        patient_id=patient_id,
        patient_update=patient_update,
        current_user_id=user_id,
        ip_address=get_client_ip(request),
    )
    return _format_patient_response(patient)
