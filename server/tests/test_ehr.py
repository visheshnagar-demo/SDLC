from server.models import Doctor, Patient


def test_ehr_clinical_workflow(
    client, doctor_token, patient_token, receptionist_token, db
):
    doc = db.query(Doctor).filter(Doctor.department == "Cardiology").first()
    pat = db.query(Patient).filter(Patient.national_id == "SSN-123-45-6789").first()

    ehr_payload = {
        "patient_id": pat.id,
        "doctor_id": doc.id,
        "diagnosis": "Stage 1 Essential Hypertension",
        "clinical_notes": "Patient reports mild dizziness in the morning. Recommended low-sodium diet and daily exercise.",
        "prescriptions": [
            {
                "medication_name": "Lisinopril",
                "dosage": "10mg",
                "frequency": "Once Daily in Morning",
                "duration_days": 30,
            },
            {
                "medication_name": "Hydrochlorothiazide",
                "dosage": "12.5mg",
                "frequency": "Once Daily",
                "duration_days": 30,
            },
        ],
        "lab_orders": ["Comprehensive Metabolic Panel (CMP)", "Lipid Panel", "ECG"],
    }

    # 1. Non-doctor (patient) cannot create EHR record -> 403
    forbidden_resp = client.post(
        "/api/v1/ehr/records",
        json=ehr_payload,
        headers={"Authorization": f"Bearer {patient_token}"},
    )
    assert forbidden_resp.status_code == 403

    # 2. Doctor creates EHR record -> 201
    create_resp = client.post(
        "/api/v1/ehr/records",
        json=ehr_payload,
        headers={"Authorization": f"Bearer {doctor_token}"},
    )
    assert create_resp.status_code == 201
    record_data = create_resp.json()
    assert record_data["diagnosis"] == "Stage 1 Essential Hypertension"
    assert len(record_data["prescriptions"]) == 2
    record_id = record_data["id"]

    # 3. Doctor updates EHR record -> 200
    update_resp = client.patch(
        f"/api/v1/ehr/records/{record_id}",
        json={
            "diagnosis": "Controlled Stage 1 Hypertension",
            "clinical_notes": "BP stabilized under medication.",
        },
        headers={"Authorization": f"Bearer {doctor_token}"},
    )
    assert update_resp.status_code == 200
    assert update_resp.json()["diagnosis"] == "Controlled Stage 1 Hypertension"

    # 4. Patient views own medical history -> 200
    pat_ehr_resp = client.get(
        f"/api/v1/ehr/patients/{pat.id}",
        headers={"Authorization": f"Bearer {patient_token}"},
    )
    assert pat_ehr_resp.status_code == 200
    assert len(pat_ehr_resp.json()) >= 1

    # 5. Receptionist is blocked from viewing EHR records (HIPAA segregation) -> 403
    rec_ehr_resp = client.get(
        f"/api/v1/ehr/patients/{pat.id}",
        headers={"Authorization": f"Bearer {receptionist_token}"},
    )
    assert rec_ehr_resp.status_code == 403

    # 6. Download prescription summary / PDF link
    dl_resp = client.get(
        f"/api/v1/ehr/records/{record_id}/download-prescription",
        headers={"Authorization": f"Bearer {patient_token}"},
    )
    assert dl_resp.status_code == 200
    dl_data = dl_resp.json()
    assert "download_url" in dl_data
    assert (
        dl_data["prescription_summary"]["diagnosis"]
        == "Controlled Stage 1 Hypertension"
    )
