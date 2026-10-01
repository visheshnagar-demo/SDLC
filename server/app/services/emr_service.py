import uuid
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from server.app.models.doctor import Doctor
from server.app.models.medical_record import (
    ClinicalNote,
    ClinicalNoteAddendum,
    Encounter,
    LabOrder,
    Prescription,
)
from server.app.models.patient import Patient
from server.app.schemas.medical_record import (
    ClinicalNoteAddendumCreate,
    ClinicalNoteCreate,
    EncounterCreate,
    LabOrderCreate,
    PrescriptionCreate,
)
from server.app.services.audit_service import log_audit


def create_encounter(
    db: Session,
    enc_in: EncounterCreate,
    current_user_id: Optional[str] = None,
    ip_address: Optional[str] = None,
) -> Encounter:
    # Verify patient exists
    patient = db.query(Patient).filter(Patient.id == enc_in.patient_id).first()
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient with ID '{enc_in.patient_id}' not found.",
        )

    # Verify doctor exists
    doctor = db.query(Doctor).filter(Doctor.id == enc_in.doctor_id).first()
    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Doctor with ID '{enc_in.doctor_id}' not found.",
        )

    encounter = Encounter(
        id=str(uuid.uuid4()),
        patient_id=enc_in.patient_id,
        doctor_id=enc_in.doctor_id,
        appointment_id=enc_in.appointment_id,
        encounter_date=enc_in.encounter_date or datetime.now(timezone.utc),
        chief_complaint=enc_in.chief_complaint,
        status=enc_in.status or "OPEN",
    )
    db.add(encounter)
    db.commit()
    db.refresh(encounter)

    log_audit(
        db=db,
        action="CREATE_ENCOUNTER",
        entity_type="Encounter",
        entity_id=encounter.id,
        user_id=current_user_id,
        details={"patient_id": encounter.patient_id, "doctor_id": encounter.doctor_id},
        ip_address=ip_address,
    )

    return encounter


def get_encounters_by_patient(
    db: Session,
    patient_id: str,
    current_user_id: Optional[str] = None,
    ip_address: Optional[str] = None,
) -> List[Encounter]:
    encounters = (
        db.query(Encounter)
        .filter(Encounter.patient_id == patient_id)
        .order_by(Encounter.encounter_date.desc())
        .all()
    )

    log_audit(
        db=db,
        action="VIEW_PATIENT_ENCOUNTERS",
        entity_type="Encounter",
        user_id=current_user_id,
        details={"patient_id": patient_id, "count": len(encounters)},
        ip_address=ip_address,
    )

    return encounters


def create_clinical_note(
    db: Session,
    note_in: ClinicalNoteCreate,
    current_user_id: Optional[str] = None,
    ip_address: Optional[str] = None,
) -> ClinicalNote:
    # Verify encounter exists
    encounter = db.query(Encounter).filter(Encounter.id == note_in.encounter_id).first()
    if not encounter:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Encounter with ID '{note_in.encounter_id}' not found.",
        )

    is_signed = bool(note_in.is_signed)
    signed_at = datetime.now(timezone.utc) if is_signed else None

    note = ClinicalNote(
        id=str(uuid.uuid4()),
        encounter_id=note_in.encounter_id,
        doctor_id=note_in.doctor_id,
        note_text=note_in.note_text,
        diagnosis=note_in.diagnosis,
        is_signed=is_signed,
        signed_at=signed_at,
    )
    db.add(note)
    db.commit()
    db.refresh(note)

    log_audit(
        db=db,
        action="CREATE_CLINICAL_NOTE"
        if not is_signed
        else "CREATE_AND_SIGN_CLINICAL_NOTE",
        entity_type="ClinicalNote",
        entity_id=note.id,
        user_id=current_user_id,
        details={"encounter_id": note.encounter_id, "is_signed": note.is_signed},
        ip_address=ip_address,
    )

    return note


def update_clinical_note(
    db: Session,
    note_id: str,
    note_text: str,
    diagnosis: str,
    current_user_id: Optional[str] = None,
    ip_address: Optional[str] = None,
) -> ClinicalNote:
    note = db.query(ClinicalNote).filter(ClinicalNote.id == note_id).first()
    if not note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Clinical note with ID '{note_id}' not found.",
        )

    # Immutability check
    if note.is_signed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Signed clinical notes are immutable and cannot be updated. Please append a signed addendum.",
        )

    note.note_text = note_text
    note.diagnosis = diagnosis
    db.commit()
    db.refresh(note)

    log_audit(
        db=db,
        action="UPDATE_CLINICAL_NOTE",
        entity_type="ClinicalNote",
        entity_id=note.id,
        user_id=current_user_id,
        ip_address=ip_address,
    )

    return note


def sign_clinical_note(
    db: Session,
    note_id: str,
    current_user_id: Optional[str] = None,
    ip_address: Optional[str] = None,
) -> ClinicalNote:
    note = db.query(ClinicalNote).filter(ClinicalNote.id == note_id).first()
    if not note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Clinical note with ID '{note_id}' not found.",
        )

    if note.is_signed:
        return note

    note.is_signed = True
    note.signed_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(note)

    log_audit(
        db=db,
        action="SIGN_CLINICAL_NOTE",
        entity_type="ClinicalNote",
        entity_id=note.id,
        user_id=current_user_id,
        ip_address=ip_address,
    )

    return note


def add_note_addendum(
    db: Session,
    note_id: str,
    addendum_in: ClinicalNoteAddendumCreate,
    author_id: str,
    ip_address: Optional[str] = None,
) -> ClinicalNoteAddendum:
    note = db.query(ClinicalNote).filter(ClinicalNote.id == note_id).first()
    if not note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Clinical note with ID '{note_id}' not found.",
        )

    addendum = ClinicalNoteAddendum(
        id=str(uuid.uuid4()),
        note_id=note_id,
        author_id=author_id,
        addendum_text=addendum_in.addendum_text,
    )
    db.add(addendum)
    db.commit()
    db.refresh(addendum)

    log_audit(
        db=db,
        action="ADD_NOTE_ADDENDUM",
        entity_type="ClinicalNoteAddendum",
        entity_id=addendum.id,
        user_id=author_id,
        details={"note_id": note_id},
        ip_address=ip_address,
    )

    return addendum


def create_prescription(
    db: Session,
    rx_in: PrescriptionCreate,
    current_user_id: Optional[str] = None,
    ip_address: Optional[str] = None,
) -> Prescription:
    encounter = db.query(Encounter).filter(Encounter.id == rx_in.encounter_id).first()
    if not encounter:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Encounter with ID '{rx_in.encounter_id}' not found.",
        )

    prescription = Prescription(
        id=str(uuid.uuid4()),
        encounter_id=rx_in.encounter_id,
        medication_name=rx_in.medication_name,
        dosage=rx_in.dosage,
        frequency=rx_in.frequency,
        duration=rx_in.duration,
        instructions=rx_in.instructions,
    )
    db.add(prescription)
    db.commit()
    db.refresh(prescription)

    log_audit(
        db=db,
        action="CREATE_PRESCRIPTION",
        entity_type="Prescription",
        entity_id=prescription.id,
        user_id=current_user_id,
        details={"medication": prescription.medication_name},
        ip_address=ip_address,
    )

    return prescription


def create_lab_order(
    db: Session,
    lab_in: LabOrderCreate,
    current_user_id: Optional[str] = None,
    ip_address: Optional[str] = None,
) -> LabOrder:
    encounter = db.query(Encounter).filter(Encounter.id == lab_in.encounter_id).first()
    if not encounter:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Encounter with ID '{lab_in.encounter_id}' not found.",
        )

    lab_order = LabOrder(
        id=str(uuid.uuid4()),
        encounter_id=lab_in.encounter_id,
        test_name=lab_in.test_name,
        priority=lab_in.priority or "ROUTINE",
        status="ORDERED",
        notes=lab_in.notes,
    )
    db.add(lab_order)
    db.commit()
    db.refresh(lab_order)

    log_audit(
        db=db,
        action="CREATE_LAB_ORDER",
        entity_type="LabOrder",
        entity_id=lab_order.id,
        user_id=current_user_id,
        details={"test_name": lab_order.test_name, "priority": lab_order.priority},
        ip_address=ip_address,
    )

    return lab_order
