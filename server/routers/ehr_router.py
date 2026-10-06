import uuid
import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from server.database import get_db
from server import models, schemas
from server.auth import get_optional_user

router = APIRouter(prefix="/api/v1/ehr", tags=["Electronic Health Records"])


@router.get(
    "/patients/{patient_id}/encounters",
    response_model=List[schemas.ClinicalEncounterResponse],
)
def get_patient_encounters(
    patient_id: str,
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_optional_user),
):
    patient = db.query(models.Patient).filter(models.Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient {patient_id} not found",
        )

    encounters = (
        db.query(models.ClinicalEncounter)
        .filter(models.ClinicalEncounter.patient_id == patient_id)
        .order_by(models.ClinicalEncounter.created_at.desc())
        .all()
    )

    # Log HIPAA PHI Access
    audit = models.AuditLog(
        id=str(uuid.uuid4()),
        user_id=current_user.id if current_user else None,
        action="VIEW_EHR_ENCOUNTERS",
        resource_type="ClinicalEncounter",
        resource_id=patient_id,
        details=f"Viewed encounters for patient MRN {patient.mrn}",
    )
    db.add(audit)
    db.commit()

    # Format vitals and diagnosis_codes for response
    results = []
    for enc in encounters:
        vitals_data = None
        if enc.vitals:
            try:
                vitals_data = json.loads(enc.vitals)
            except Exception:
                vitals_data = enc.vitals

        diagnosis_data = None
        if enc.diagnosis_codes:
            try:
                diagnosis_data = json.loads(enc.diagnosis_codes)
            except Exception:
                diagnosis_data = [d.strip() for d in enc.diagnosis_codes.split(",")]

        results.append(
            schemas.ClinicalEncounterResponse(
                id=enc.id,
                patient_id=enc.patient_id,
                doctor_id=enc.doctor_id,
                appointment_id=enc.appointment_id,
                chief_complaint=enc.chief_complaint,
                clinical_notes=enc.clinical_notes,
                vitals=vitals_data,
                diagnosis_codes=diagnosis_data,
                status=enc.status,
                created_at=enc.created_at,
                updated_at=enc.updated_at,
                prescriptions=enc.prescriptions,
                lab_orders=enc.lab_orders,
                patient=enc.patient,
                doctor=enc.doctor,
            )
        )
    return results


@router.post(
    "/encounters",
    response_model=schemas.ClinicalEncounterResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_encounter(
    enc_in: schemas.ClinicalEncounterCreate,
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_optional_user),
):
    patient = (
        db.query(models.Patient).filter(models.Patient.id == enc_in.patient_id).first()
    )
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient {enc_in.patient_id} not found",
        )

    doctor_id = enc_in.doctor_id
    if not doctor_id and enc_in.appointment_id:
        appt = (
            db.query(models.Appointment)
            .filter(models.Appointment.id == enc_in.appointment_id)
            .first()
        )
        if appt:
            doctor_id = appt.doctor_id

    if not doctor_id:
        first_doc = db.query(models.Doctor).first()
        doctor_id = first_doc.id if first_doc else str(uuid.uuid4())

    encounter_id = str(uuid.uuid4())
    vitals_json = json.dumps(enc_in.vitals) if enc_in.vitals else None
    diagnosis_json = (
        json.dumps(enc_in.diagnosis_codes) if enc_in.diagnosis_codes else None
    )

    encounter = models.ClinicalEncounter(
        id=encounter_id,
        appointment_id=enc_in.appointment_id,
        patient_id=enc_in.patient_id,
        doctor_id=doctor_id,
        chief_complaint=enc_in.chief_complaint,
        clinical_notes=enc_in.clinical_notes,
        vitals=vitals_json,
        diagnosis_codes=diagnosis_json,
        status="In Progress",
    )
    db.add(encounter)

    # Add initial prescriptions
    if enc_in.prescriptions:
        for rx in enc_in.prescriptions:
            db_rx = models.Prescription(
                id=str(uuid.uuid4()),
                encounter_id=encounter_id,
                patient_id=enc_in.patient_id,
                medication=rx.medication,
                dosage=rx.dosage,
                frequency=rx.frequency,
                duration=rx.duration,
                instructions=rx.instructions,
            )
            db.add(db_rx)

    # Add initial lab orders
    if enc_in.lab_orders:
        for lab in enc_in.lab_orders:
            db_lab = models.LabOrder(
                id=str(uuid.uuid4()),
                encounter_id=encounter_id,
                patient_id=enc_in.patient_id,
                test_name=lab.test_name,
                priority=lab.priority or "Routine",
                status="Ordered",
                notes=lab.notes,
            )
            db.add(db_lab)

    # Update appointment status if linked
    if enc_in.appointment_id:
        appt = (
            db.query(models.Appointment)
            .filter(models.Appointment.id == enc_in.appointment_id)
            .first()
        )
        if appt:
            appt.status = "In Progress"

    # Audit log
    audit = models.AuditLog(
        id=str(uuid.uuid4()),
        user_id=current_user.id if current_user else None,
        action="CREATE_CLINICAL_ENCOUNTER",
        resource_type="ClinicalEncounter",
        resource_id=encounter_id,
        details=f"Clinical encounter created for patient MRN {patient.mrn}",
    )
    db.add(audit)

    db.commit()
    db.refresh(encounter)

    vitals_data = json.loads(encounter.vitals) if encounter.vitals else None
    diagnosis_data = (
        json.loads(encounter.diagnosis_codes) if encounter.diagnosis_codes else None
    )

    return schemas.ClinicalEncounterResponse(
        id=encounter.id,
        patient_id=encounter.patient_id,
        doctor_id=encounter.doctor_id,
        appointment_id=encounter.appointment_id,
        chief_complaint=encounter.chief_complaint,
        clinical_notes=encounter.clinical_notes,
        vitals=vitals_data,
        diagnosis_codes=diagnosis_data,
        status=encounter.status,
        created_at=encounter.created_at,
        updated_at=encounter.updated_at,
        prescriptions=encounter.prescriptions,
        lab_orders=encounter.lab_orders,
        patient=encounter.patient,
        doctor=encounter.doctor,
    )


@router.get("/encounters/{id}", response_model=schemas.ClinicalEncounterResponse)
def get_encounter(
    id: str,
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_optional_user),
):
    encounter = (
        db.query(models.ClinicalEncounter)
        .filter(models.ClinicalEncounter.id == id)
        .first()
    )
    if not encounter:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Clinical encounter {id} not found",
        )

    audit = models.AuditLog(
        id=str(uuid.uuid4()),
        user_id=current_user.id if current_user else None,
        action="VIEW_CLINICAL_ENCOUNTER",
        resource_type="ClinicalEncounter",
        resource_id=encounter.id,
        details=f"Encounter {id} viewed",
    )
    db.add(audit)
    db.commit()

    vitals_data = json.loads(encounter.vitals) if encounter.vitals else None
    diagnosis_data = (
        json.loads(encounter.diagnosis_codes) if encounter.diagnosis_codes else None
    )

    return schemas.ClinicalEncounterResponse(
        id=encounter.id,
        patient_id=encounter.patient_id,
        doctor_id=encounter.doctor_id,
        appointment_id=encounter.appointment_id,
        chief_complaint=encounter.chief_complaint,
        clinical_notes=encounter.clinical_notes,
        vitals=vitals_data,
        diagnosis_codes=diagnosis_data,
        status=encounter.status,
        created_at=encounter.created_at,
        updated_at=encounter.updated_at,
        prescriptions=encounter.prescriptions,
        lab_orders=encounter.lab_orders,
        patient=encounter.patient,
        doctor=encounter.doctor,
    )


@router.post("/encounters/{id}/close", response_model=schemas.InvoiceResponse)
def close_encounter(
    id: str,
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_optional_user),
):
    encounter = (
        db.query(models.ClinicalEncounter)
        .filter(models.ClinicalEncounter.id == id)
        .first()
    )
    if not encounter:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Clinical encounter {id} not found",
        )

    # Set encounter and appointment to completed
    encounter.status = "Completed"
    if encounter.appointment:
        encounter.appointment.status = "Completed"

    # Compile itemized billable items
    line_items = []
    total_charges = 0.0

    # 1. Doctor consultation fee
    doctor = (
        db.query(models.Doctor).filter(models.Doctor.id == encounter.doctor_id).first()
    )
    consult_fee = doctor.consultation_fee if doctor else 150.0
    line_items.append(
        {
            "description": f"Specialist Consultation Fee ({doctor.specialty if doctor else 'General'})",
            "cpt_code": "99204",
            "amount": consult_fee,
        }
    )
    total_charges += consult_fee

    # 2. Lab tests fees
    for lab in encounter.lab_orders:
        lab_fee = 50.0
        line_items.append(
            {
                "description": f"Lab Test: {lab.test_name}",
                "cpt_code": "80053",
                "amount": lab_fee,
            }
        )
        total_charges += lab_fee

    # 3. Prescriptions dispensing fee
    for rx in encounter.prescriptions:
        rx_fee = 20.0
        line_items.append(
            {
                "description": f"Pharmacy: {rx.medication} {rx.dosage}",
                "cpt_code": "J3490",
                "amount": rx_fee,
            }
        )
        total_charges += rx_fee

    # Determine Copay based on patient insurance
    patient = (
        db.query(models.Patient)
        .filter(models.Patient.id == encounter.patient_id)
        .first()
    )
    copay = 30.0 if (patient and patient.insurance_provider) else 0.0
    balance = max(0.0, total_charges - copay)

    invoice_id = str(uuid.uuid4())
    invoice = models.Invoice(
        id=invoice_id,
        encounter_id=encounter.id,
        patient_id=encounter.patient_id,
        total_amount=total_charges,
        copay_amount=copay,
        patient_balance=balance,
        status="Unpaid",
    )
    db.add(invoice)

    for item in line_items:
        inv_item = models.InvoiceItem(
            id=str(uuid.uuid4()),
            invoice_id=invoice_id,
            description=item["description"],
            cpt_code=item.get("cpt_code"),
            amount=item["amount"],
        )
        db.add(inv_item)

    audit = models.AuditLog(
        id=str(uuid.uuid4()),
        user_id=current_user.id if current_user else None,
        action="CLOSE_ENCOUNTER_GENERATE_INVOICE",
        resource_type="Invoice",
        resource_id=invoice_id,
        details=f"Closed encounter {id}, generated invoice {invoice_id} for ${total_charges:.2f}",
    )
    db.add(audit)

    db.commit()
    db.refresh(invoice)
    return invoice
