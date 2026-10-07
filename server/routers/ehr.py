import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session

from server.database import get_db
from server.models import User, Patient, Doctor, Appointment, EHRRecord
from server.schemas import (
    EHRRecordCreate,
    EHRRecordUpdate,
    EHRRecordResponse,
    PrescriptionDownloadResponse,
)
from server.dependencies import get_current_user, record_audit

router = APIRouter(prefix="/api/v1/ehr", tags=["Electronic Health Records (EHR)"])


@router.post(
    "/records", response_model=EHRRecordResponse, status_code=status.HTTP_201_CREATED
)
def create_ehr_record(
    ehr_in: EHRRecordCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Only DOCTOR (or ADMIN) can create clinical notes
    if current_user.role not in ["DOCTOR", "ADMIN"]:
        record_audit(
            db=db,
            action="UNAUTHORIZED_EHR_ACCESS_ATTEMPT",
            resource_type="EHR_RECORD",
            user_id=current_user.id,
            details={
                "patient_id": ehr_in.patient_id,
                "attempted_role": current_user.role,
            },
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only licensed physicians and authorized clinical staff can create EHR records.",
        )

    # Validate patient
    patient = db.query(Patient).filter(Patient.id == ehr_in.patient_id).first()
    if not patient:
        patient = db.query(Patient).filter(Patient.user_id == ehr_in.patient_id).first()
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient with id {ehr_in.patient_id} not found.",
        )

    # Validate doctor
    doctor_id = ehr_in.doctor_id
    if not doctor_id and current_user.role == "DOCTOR":
        doc_profile = db.query(Doctor).filter(Doctor.user_id == current_user.id).first()
        if doc_profile:
            doctor_id = doc_profile.id

    if not doctor_id:
        doc_profile = db.query(Doctor).first()
        if doc_profile:
            doctor_id = doc_profile.id
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A valid doctor ID or profile is required to issue clinical notes.",
            )

    # Validate appointment if provided
    if ehr_in.appointment_id:
        appt = (
            db.query(Appointment)
            .filter(Appointment.id == ehr_in.appointment_id)
            .first()
        )
        if not appt:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Appointment with id {ehr_in.appointment_id} not found.",
            )

    new_record = EHRRecord(
        id=str(uuid.uuid4()),
        patient_id=patient.id,
        doctor_id=doctor_id,
        appointment_id=ehr_in.appointment_id,
        diagnosis=ehr_in.diagnosis,
        clinical_notes=ehr_in.clinical_notes,
        prescriptions=ehr_in.prescriptions or [],
        lab_orders=ehr_in.lab_orders or [],
    )
    db.add(new_record)
    db.commit()
    db.refresh(new_record)

    client_ip = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")
    record_audit(
        db=db,
        action="CREATE_EHR",
        resource_type="EHR_RECORD",
        resource_id=new_record.id,
        user_id=current_user.id,
        ip_address=client_ip,
        user_agent=user_agent,
        details={"patient_id": patient.id, "diagnosis": new_record.diagnosis},
    )

    return new_record


@router.patch("/records/{record_id}", response_model=EHRRecordResponse)
@router.put("/records/{record_id}", response_model=EHRRecordResponse)
def update_ehr_record(
    record_id: str,
    ehr_in: EHRRecordUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    record = db.query(EHRRecord).filter(EHRRecord.id == record_id).first()
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"EHR record with id {record_id} not found.",
        )

    if current_user.role not in ["DOCTOR", "ADMIN"]:
        record_audit(
            db=db,
            action="UNAUTHORIZED_EHR_UPDATE_ATTEMPT",
            resource_type="EHR_RECORD",
            resource_id=record.id,
            user_id=current_user.id,
            details={"attempted_role": current_user.role},
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only licensed physicians and authorized clinical staff can update EHR records.",
        )

    for field, value in ehr_in.model_dump(exclude_unset=True).items():
        if value is not None:
            setattr(record, field, value)

    db.commit()
    db.refresh(record)

    client_ip = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")
    record_audit(
        db=db,
        action="UPDATE_EHR",
        resource_type="EHR_RECORD",
        resource_id=record.id,
        user_id=current_user.id,
        ip_address=client_ip,
        user_agent=user_agent,
        details={"diagnosis": record.diagnosis},
    )

    return record


@router.get("/patients/{patient_id}", response_model=List[EHRRecordResponse])
def get_patient_ehr_records(
    patient_id: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Lookup patient
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        patient = db.query(Patient).filter(Patient.user_id == patient_id).first()

    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient with id {patient_id} not found.",
        )

    # RBAC rules:
    # ADMIN, DOCTOR, NURSE can view
    # PATIENT can view ONLY their own records
    # RECEPTIONIST is strictly BLOCKED
    if current_user.role == "RECEPTIONIST":
        record_audit(
            db=db,
            action="UNAUTHORIZED_EHR_ACCESS_ATTEMPT",
            resource_type="EHR_RECORD",
            user_id=current_user.id,
            details={"patient_id": patient.id, "role": current_user.role},
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Receptionist staff are not permitted to view Electronic Health Records (HIPAA segregation).",
        )

    if current_user.role == "PATIENT" and patient.user_id != current_user.id:
        record_audit(
            db=db,
            action="UNAUTHORIZED_EHR_ACCESS_ATTEMPT",
            resource_type="EHR_RECORD",
            user_id=current_user.id,
            details={"target_patient_id": patient.id},
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. You can only view your own medical records.",
        )

    records = (
        db.query(EHRRecord)
        .filter(EHRRecord.patient_id == patient.id)
        .order_by(EHRRecord.created_at.desc())
        .all()
    )

    client_ip = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")
    record_audit(
        db=db,
        action="READ_EHR",
        resource_type="EHR_RECORD",
        resource_id=patient.id,
        user_id=current_user.id,
        ip_address=client_ip,
        user_agent=user_agent,
        details={"record_count": len(records)},
    )

    return records


@router.get("/records/{record_id}", response_model=EHRRecordResponse)
def get_ehr_record(
    record_id: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    record = db.query(EHRRecord).filter(EHRRecord.id == record_id).first()
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"EHR record with id {record_id} not found.",
        )

    if current_user.role == "RECEPTIONIST":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Receptionist staff are not permitted to view EHR records.",
        )

    if current_user.role == "PATIENT":
        patient = db.query(Patient).filter(Patient.id == record.patient_id).first()
        if not patient or patient.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied. You can only view your own EHR records.",
            )

    return record


@router.get(
    "/records/{record_id}/download-prescription",
    response_model=PrescriptionDownloadResponse,
)
def download_prescription(
    record_id: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    record = db.query(EHRRecord).filter(EHRRecord.id == record_id).first()
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"EHR record with id {record_id} not found.",
        )

    if current_user.role == "PATIENT":
        patient = db.query(Patient).filter(Patient.id == record.patient_id).first()
        if not patient or patient.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied. You can only download your own prescriptions.",
            )

    client_ip = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")
    record_audit(
        db=db,
        action="DOWNLOAD_PRESCRIPTION",
        resource_type="EHR_RECORD",
        resource_id=record.id,
        user_id=current_user.id,
        ip_address=client_ip,
        user_agent=user_agent,
    )

    download_url = f"https://storage.googleapis.com/sdlc-designer-assets/prescriptions/{record.id}_prescription.pdf"
    return PrescriptionDownloadResponse(
        download_url=download_url,
        expires_in_seconds=300,
        prescription_summary={
            "record_id": record.id,
            "patient_id": record.patient_id,
            "diagnosis": record.diagnosis,
            "prescriptions": record.prescriptions,
            "issued_at": record.created_at.isoformat() if record.created_at else None,
        },
    )
