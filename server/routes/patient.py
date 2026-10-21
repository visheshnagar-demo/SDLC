from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from server.database import get_db
from server.models.user import User
from server.schemas.patient import PatientCreateRequest, PatientUpdateRequest, PatientResponse
from server.services.patient_service import PatientService
from server.services.auth_service import get_current_user, require_roles

router = APIRouter(prefix="/patients", tags=["Patients"])

@router.post("", response_model=PatientResponse, status_code=status.HTTP_201_CREATED)
def create_patient(
    patient_data: PatientCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["ADMIN", "RECEPTIONIST", "DOCTOR", "NURSE", "PATIENT"])),
):
    return PatientService.create_patient(db, patient_data, current_user.id)

@router.get("", response_model=List[PatientResponse])
def list_patients(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return PatientService.list_patients(db, skip=skip, limit=limit, search=search, current_user_id=current_user.id)

@router.get("/{patient_id}", response_model=PatientResponse)
def get_patient(
    patient_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return PatientService.get_patient_by_id(db, patient_id, current_user.id)

@router.put("/{patient_id}", response_model=PatientResponse)
def update_patient(
    patient_id: str,
    patient_data: PatientUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["ADMIN", "RECEPTIONIST", "DOCTOR", "NURSE"])),
):
    return PatientService.update_patient(db, patient_id, patient_data, current_user.id)
