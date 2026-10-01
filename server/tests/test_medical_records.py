from fastapi.testclient import TestClient


def test_create_encounter(client: TestClient, doctor_headers: dict):
    payload = {
        "patient_id": "22222222-2222-4222-a222-222222222222",
        "doctor_id": "11111111-1111-4111-a111-111111111111",
        "chief_complaint": "Persistent chest pain and shortness of breath",
        "status": "OPEN",
    }
    response = client.post(
        "/api/v1/medical-records/encounters",
        json=payload,
        headers=doctor_headers,
    )
    assert response.status_code == 201
    data = response.json()
    assert data["chief_complaint"] == "Persistent chest pain and shortness of breath"
    assert "id" in data
    assert data["status"] == "OPEN"


def test_create_and_sign_clinical_note_immutability(
    client: TestClient, doctor_headers: dict
):
    # 1. Create encounter
    enc_res = client.post(
        "/api/v1/medical-records/encounters",
        json={
            "patient_id": "22222222-2222-4222-a222-222222222222",
            "doctor_id": "11111111-1111-4111-a111-111111111111",
            "chief_complaint": "Hypertension assessment",
        },
        headers=doctor_headers,
    )
    encounter_id = enc_res.json()["id"]

    # 2. Create signed clinical note
    note_payload = {
        "encounter_id": encounter_id,
        "doctor_id": "11111111-1111-4111-a111-111111111111",
        "note_text": "Patient exhibits elevated BP (140/90). Heart sounds regular.",
        "diagnosis": "Essential Hypertension (ICD-10 I10)",
        "is_signed": True,
    }
    note_res = client.post(
        "/api/v1/medical-records/notes",
        json=note_payload,
        headers=doctor_headers,
    )
    assert note_res.status_code == 201
    note_data = note_res.json()
    note_id = note_data["id"]
    assert note_data["is_signed"] is True
    assert note_data["signed_at"] is not None

    # 3. Attempt direct edit on signed note -> Must fail with 400 Bad Request
    edit_res = client.put(
        f"/api/v1/medical-records/notes/{note_id}",
        params={
            "note_text": "Attempted modification",
            "diagnosis": "Changed diagnosis",
        },
        headers=doctor_headers,
    )
    assert edit_res.status_code == 400
    assert "immutable" in edit_res.json()["detail"]

    # 4. Append addendum to signed note -> Must succeed
    addendum_res = client.post(
        f"/api/v1/medical-records/notes/{note_id}/addendums",
        json={"addendum_text": "Follow-up notes: Patient tolerating lisinopril well."},
        headers=doctor_headers,
    )
    assert addendum_res.status_code == 201
    addendum_data = addendum_res.json()
    assert addendum_data["note_id"] == note_id
    assert "lisinopril" in addendum_data["addendum_text"]


def test_issue_prescription_and_lab_order(client: TestClient, doctor_headers: dict):
    # 1. Create encounter
    enc_res = client.post(
        "/api/v1/medical-records/encounters",
        json={
            "patient_id": "22222222-2222-4222-a222-222222222222",
            "doctor_id": "11111111-1111-4111-a111-111111111111",
            "chief_complaint": "Type 2 Diabetes Checkup",
        },
        headers=doctor_headers,
    )
    encounter_id = enc_res.json()["id"]

    # 2. Issue prescription
    rx_payload = {
        "encounter_id": encounter_id,
        "medication_name": "Metformin",
        "dosage": "500mg",
        "frequency": "Twice daily with meals",
        "duration": "90 days",
        "instructions": "Take with breakfast and dinner",
    }
    rx_res = client.post(
        "/api/v1/medical-records/prescriptions",
        json=rx_payload,
        headers=doctor_headers,
    )
    assert rx_res.status_code == 201
    rx_data = rx_res.json()
    assert rx_data["medication_name"] == "Metformin"
    assert rx_data["dosage"] == "500mg"

    # 3. Order Lab Test
    lab_payload = {
        "encounter_id": encounter_id,
        "test_name": "Hemoglobin A1c & Lipid Panel",
        "priority": "ROUTINE",
        "notes": "Fasting required for 12 hours",
    }
    lab_res = client.post(
        "/api/v1/medical-records/lab-orders",
        json=lab_payload,
        headers=doctor_headers,
    )
    assert lab_res.status_code == 201
    lab_data = lab_res.json()
    assert lab_data["test_name"] == "Hemoglobin A1c & Lipid Panel"
    assert lab_data["status"] == "ORDERED"

    # 4. Retrieve encounters for patient
    patient_enc_res = client.get(
        "/api/v1/medical-records/encounters/22222222-2222-4222-a222-222222222222",
        headers=doctor_headers,
    )
    assert patient_enc_res.status_code == 200
    encounters = patient_enc_res.json()
    assert len(encounters) >= 1
    found_enc = next((e for e in encounters if e["id"] == encounter_id), None)
    assert found_enc is not None
    assert len(found_enc["prescriptions"]) >= 1
    assert len(found_enc["lab_orders"]) >= 1
