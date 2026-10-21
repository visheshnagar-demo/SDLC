from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from server.database import get_db
from server.models import User
from server.schemas.patient import (
    PatientCreateRequest,
    PatientUpdateRequest,
    PatientResponse,
    PaginatedPatients,
)
from server.services.auth_service import get_current_user, require_roles
from server.services.patient_service import (
    create_patient,
    update_patient,
    get_patient_by_id,
    list_patients,
)

router = APIRouter(prefix="/patients", tags=["Patients"])


@router.post("", response_model=PatientResponse, status_code=status.HTTP_201_CREATED)
def register_patient(
    patient_in: PatientCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(["ADMIN", "RECEPTIONIST", "DOCTOR", "NURSE", "PATIENT"])
    ),
):
    return create_patient(db, patient_in, current_user=current_user)


@router.get("", response_model=PaginatedPatients)
def get_patients(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(["ADMIN", "RECEPTIONIST", "DOCTOR", "NURSE", "PATIENT"])
    ),
):
    items, total = list_patients(
        db, skip=skip, limit=limit, search=search, current_user=current_user
    )
    return PaginatedPatients(
        items=[PatientResponse.from_orm(p) for p in items],
        total=total,
        skip=skip,
        limit=limit,
    )


@router.get("/{id}", response_model=PatientResponse)
def get_patient(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    patient = get_patient_by_id(db, id, current_user=current_user)
    return PatientResponse.from_orm(patient)


@router.put("/{id}", response_model=PatientResponse)
def update_patient_profile(
    id: str,
    patient_in: PatientUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(["ADMIN", "RECEPTIONIST", "DOCTOR", "NURSE"])
    ),
):
    patient = update_patient(db, id, patient_in, current_user=current_user)
    return PatientResponse.from_orm(patient)
