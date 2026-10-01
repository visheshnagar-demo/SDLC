from typing import List, Optional
from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.orm import Session
from server.app.api.deps import (
    get_client_ip,
    get_optional_current_user,
)
from server.app.core.database import get_db
from server.app.models.doctor import Doctor
from server.app.models.medical_record import (
    ClinicalNote,
    ClinicalNoteAddendum,
    Encounter,
    LabOrder,
    Prescription,
)
from server.app.models.user import User
from server.app.schemas.medical_record import (
    ClinicalNoteAddendumCreate,
    ClinicalNoteAddendumResponse,
    ClinicalNoteCreate,
    ClinicalNoteResponse,
    EncounterCreate,
    EncounterResponse,
    LabOrderCreate,
    LabOrderResponse,
    PrescriptionCreate,
    PrescriptionResponse,
)
from server.app.services.emr_service import (
    add_note_addendum,
    create_clinical_note,
    create_encounter,
    create_lab_order,
    create_prescription,
    get_encounters_by_patient,
    sign_clinical_note,
    update_clinical_note,
)

router = APIRouter(prefix="/medical-records", tags=["medical-records"])


def _format_clinical_note(db: Session, note: ClinicalNote) -> ClinicalNoteResponse:
    doctor = db.query(Doctor).filter(Doctor.id == note.doctor_id).first()
    doctor_name = f"Dr. {doctor.first_name} {doctor.last_name}" if doctor else None

    addendums_db = (
        db.query(ClinicalNoteAddendum)
        .filter(ClinicalNoteAddendum.note_id == note.id)
        .order_by(ClinicalNoteAddendum.created_at.asc())
        .all()
    )

    addendums: List[ClinicalNoteAddendumResponse] = []
    for a in addendums_db:
        author = db.query(User).filter(User.id == a.author_id).first()
        author_name = author.username if author else None
        addendums.append(
            ClinicalNoteAddendumResponse(
                id=a.id,
                note_id=a.note_id,
                author_id=a.author_id,
                author_name=author_name,
                addendum_text=a.addendum_text,
                created_at=a.created_at,
            )
        )

    return ClinicalNoteResponse(
        id=note.id,
        encounter_id=note.encounter_id,
        doctor_id=note.doctor_id,
        doctor_name=doctor_name,
        note_text=note.note_text,
        diagnosis=note.diagnosis,
        is_signed=note.is_signed,
        signed_at=note.signed_at,
        created_at=note.created_at,
        updated_at=note.updated_at,
        addendums=addendums,
    )


def _format_encounter_response(db: Session, enc: Encounter) -> EncounterResponse:
    notes_db = db.query(ClinicalNote).filter(ClinicalNote.encounter_id == enc.id).all()
    rx_db = db.query(Prescription).filter(Prescription.encounter_id == enc.id).all()
    lab_db = db.query(LabOrder).filter(LabOrder.encounter_id == enc.id).all()

    formatted_notes = [_format_clinical_note(db, n) for n in notes_db]
    formatted_rx = [PrescriptionResponse.model_validate(r) for r in rx_db]
    formatted_labs = [LabOrderResponse.model_validate(l) for l in lab_db]

    return EncounterResponse(
        id=enc.id,
        patient_id=enc.patient_id,
        doctor_id=enc.doctor_id,
        appointment_id=enc.appointment_id,
        encounter_date=enc.encounter_date,
        chief_complaint=enc.chief_complaint,
        status=enc.status,
        created_at=enc.created_at,
        updated_at=enc.updated_at,
        notes=formatted_notes,
        prescriptions=formatted_rx,
        lab_orders=formatted_labs,
    )


@router.post(
    "/encounters", response_model=EncounterResponse, status_code=status.HTTP_201_CREATED
)
def create_visit_encounter(
    enc_in: EncounterCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    user_id = current_user.id if current_user else None
    enc = create_encounter(
        db=db,
        enc_in=enc_in,
        current_user_id=user_id,
        ip_address=get_client_ip(request),
    )
    return _format_encounter_response(db, enc)


@router.get("/encounters/{patient_id}", response_model=List[EncounterResponse])
def get_patient_encounters(
    patient_id: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    user_id = current_user.id if current_user else None
    encounters = get_encounters_by_patient(
        db=db,
        patient_id=patient_id,
        current_user_id=user_id,
        ip_address=get_client_ip(request),
    )
    return [_format_encounter_response(db, e) for e in encounters]


@router.post(
    "/notes", response_model=ClinicalNoteResponse, status_code=status.HTTP_201_CREATED
)
def create_note(
    note_in: ClinicalNoteCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    user_id = current_user.id if current_user else None
    note = create_clinical_note(
        db=db,
        note_in=note_in,
        current_user_id=user_id,
        ip_address=get_client_ip(request),
    )
    return _format_clinical_note(db, note)


@router.post("/notes/{note_id}/sign", response_model=ClinicalNoteResponse)
def sign_note(
    note_id: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    user_id = current_user.id if current_user else None
    note = sign_clinical_note(
        db=db,
        note_id=note_id,
        current_user_id=user_id,
        ip_address=get_client_ip(request),
    )
    return _format_clinical_note(db, note)


@router.put("/notes/{note_id}", response_model=ClinicalNoteResponse)
def edit_note(
    note_id: str,
    note_text: str,
    diagnosis: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    user_id = current_user.id if current_user else None
    note = update_clinical_note(
        db=db,
        note_id=note_id,
        note_text=note_text,
        diagnosis=diagnosis,
        current_user_id=user_id,
        ip_address=get_client_ip(request),
    )
    return _format_clinical_note(db, note)


@router.post(
    "/notes/{note_id}/addendums",
    response_model=ClinicalNoteAddendumResponse,
    status_code=status.HTTP_201_CREATED,
)
def append_note_addendum(
    note_id: str,
    addendum_in: ClinicalNoteAddendumCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    author_id = (
        current_user.id if current_user else "11111111-1111-4111-a111-111111111111"
    )
    addendum = add_note_addendum(
        db=db,
        note_id=note_id,
        addendum_in=addendum_in,
        author_id=author_id,
        ip_address=get_client_ip(request),
    )
    author = db.query(User).filter(User.id == addendum.author_id).first()
    return ClinicalNoteAddendumResponse(
        id=addendum.id,
        note_id=addendum.note_id,
        author_id=addendum.author_id,
        author_name=author.username if author else None,
        addendum_text=addendum.addendum_text,
        created_at=addendum.created_at,
    )


@router.post(
    "/prescriptions",
    response_model=PrescriptionResponse,
    status_code=status.HTTP_201_CREATED,
)
def issue_prescription(
    rx_in: PrescriptionCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    user_id = current_user.id if current_user else None
    rx = create_prescription(
        db=db,
        rx_in=rx_in,
        current_user_id=user_id,
        ip_address=get_client_ip(request),
    )
    return PrescriptionResponse.model_validate(rx)


@router.post(
    "/lab-orders", response_model=LabOrderResponse, status_code=status.HTTP_201_CREATED
)
def order_lab_test(
    lab_in: LabOrderCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    user_id = current_user.id if current_user else None
    lab = create_lab_order(
        db=db,
        lab_in=lab_in,
        current_user_id=user_id,
        ip_address=get_client_ip(request),
    )
    return LabOrderResponse.model_validate(lab)
