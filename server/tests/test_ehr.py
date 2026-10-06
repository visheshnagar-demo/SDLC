def test_create_and_get_clinical_encounter(client, doctor_headers):
    patients = client.get("/api/v1/patients").json()
    doctors = client.get("/api/v1/doctors").json()
    patient_id = patients[0]["id"]
    doctor_id = doctors[0]["id"]

    encounter_payload = {
        "patient_id": patient_id,
        "doctor_id": doctor_id,
        "chief_complaint": "Persistent tension headaches & elevated BP",
        "clinical_notes": "Patient reports 3-week history of episodic morning headaches. Vitals recorded.",
        "vitals": {
            "bp": "142/90 mmHg",
            "hr": "76 bpm",
            "temp": "98.6 F",
            "spo2": "99%",
        },
        "diagnosis_codes": [
            "I10 - Essential Hypertension",
            "G44.2 - Tension-type Headache",
        ],
        "prescriptions": [
            {
                "medication": "Lisinopril",
                "dosage": "10mg",
                "frequency": "Once daily",
                "duration": "30 days",
                "instructions": "Take in morning with water",
            }
        ],
        "lab_orders": [
            {
                "test_name": "Comprehensive Metabolic Panel (CMP)",
                "priority": "Routine",
                "notes": "Baseline renal & electrolyte check",
            }
        ],
    }

    response = client.post(
        "/api/v1/ehr/encounters", json=encounter_payload, headers=doctor_headers
    )
    assert response.status_code == 201
    enc_data = response.json()
    assert enc_data["id"] is not None
    assert enc_data["status"] == "In Progress"
    assert len(enc_data["prescriptions"]) == 1
    assert len(enc_data["lab_orders"]) == 1

    # Verify fetching encounters for patient
    patient_encs_res = client.get(
        f"/api/v1/ehr/patients/{patient_id}/encounters", headers=doctor_headers
    )
    assert patient_encs_res.status_code == 200
    assert len(patient_encs_res.json()) >= 1

    # Verify fetching specific encounter
    enc_id = enc_data["id"]
    single_res = client.get(f"/api/v1/ehr/encounters/{enc_id}", headers=doctor_headers)
    assert single_res.status_code == 200
    assert (
        single_res.json()["chief_complaint"]
        == "Persistent tension headaches & elevated BP"
    )


def test_close_encounter_and_auto_generate_invoice(client, doctor_headers):
    patients = client.get("/api/v1/patients").json()
    doctors = client.get("/api/v1/doctors").json()
    patient_id = patients[0]["id"]
    doctor_id = doctors[0]["id"]

    encounter_payload = {
        "patient_id": patient_id,
        "doctor_id": doctor_id,
        "chief_complaint": "Acute pharyngitis",
        "clinical_notes": "Sore throat, fever 101F. Prescribed amoxicillin and ordered rapid strep.",
        "prescriptions": [
            {
                "medication": "Amoxicillin",
                "dosage": "500mg",
                "frequency": "TID",
                "duration": "10 days",
                "instructions": "Take with meals",
            }
        ],
        "lab_orders": [{"test_name": "Rapid Strep Test", "priority": "Stat"}],
    }

    create_res = client.post(
        "/api/v1/ehr/encounters", json=encounter_payload, headers=doctor_headers
    )
    assert create_res.status_code == 201
    enc_id = create_res.json()["id"]

    # Close encounter -> should generate invoice
    close_res = client.post(
        f"/api/v1/ehr/encounters/{enc_id}/close", headers=doctor_headers
    )
    assert close_res.status_code == 200
    invoice_data = close_res.json()
    assert invoice_data["encounter_id"] == enc_id
    assert invoice_data["patient_id"] == patient_id
    assert invoice_data["total_amount"] > 0
    assert invoice_data["status"] == "Unpaid"
    assert len(invoice_data["items"]) >= 2  # consult fee + lab + rx
