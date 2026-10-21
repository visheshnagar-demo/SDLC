from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from server.database import get_db
from server.models.user import User
from server.schemas.clinical_record import ClinicalRecordCreateRequest, ClinicalRecordResponse
from server.services.clinical_service import ClinicalService
from server.services.auth_service import require_roles

router = APIRouter(prefix="/clinical-records", tags=["Clinical Records"])

@router.post("/appointments/{appointment_id}", response_model=ClinicalRecordResponse, status_code=status.HTTP_201_CREATED)
def create_record(
    appointment_id: str,
    record_data: ClinicalRecordCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["ADMIN", "DOCTOR"])),
):
    return ClinicalService.create_record(db, appointment_id, record_data, current_user.id)

@router.get("/appointments/{appointment_id}", response_model=ClinicalRecordResponse)
def get_record(
    appointment_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["ADMIN", "DOCTOR", "NURSE", "PATIENT"])),
):
    return ClinicalService.get_record(db, appointment_id, current_user.id)
