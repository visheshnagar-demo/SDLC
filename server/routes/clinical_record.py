from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from server.database import get_db
from server.models import User
from server.schemas.clinical_record import (
    ClinicalRecordCreateRequest,
    ClinicalRecordResponse,
)
from server.services.auth_service import require_roles
from server.services.clinical_service import (
    create_clinical_record,
    get_clinical_record,
)

router = APIRouter(prefix="/appointments", tags=["Clinical Records"])


@router.post(
    "/{id}/records",
    response_model=ClinicalRecordResponse,
    status_code=status.HTTP_201_CREATED,
)
def record_clinical_consultation(
    id: str,
    record_in: ClinicalRecordCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["ADMIN", "DOCTOR"])),
):
    record = create_clinical_record(
        db, appointment_id=id, record_in=record_in, current_user=current_user
    )
    return ClinicalRecordResponse.from_orm(record)


@router.get("/{id}/records", response_model=ClinicalRecordResponse)
def get_appointment_clinical_record(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(["ADMIN", "DOCTOR", "NURSE", "PATIENT"])
    ),
):
    record = get_clinical_record(db, appointment_id=id, current_user=current_user)
    return ClinicalRecordResponse.from_orm(record)
