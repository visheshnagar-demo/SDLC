from datetime import datetime, timedelta, timezone


def test_list_health_records(client):
    response = client.get("/api/v1/health-records")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)


def test_create_health_record_with_withdrawal(client):
    # Register cow
    cow_payload = {
        "tag_number": "COW-VET1",
        "rfid_tag": "982 000099990001",
        "breed": "Holstein-Friesian",
        "gender": "Female",
        "date_of_birth": "2022-04-10",
        "status": "Lactating",
    }
    c_resp = client.post("/api/v1/cattle", json=cow_payload)
    assert c_resp.status_code == 201
    cow_id = c_resp.json()["id"]

    now = datetime.now(timezone.utc)
    payload = {
        "cow_id": cow_id,
        "record_type": "Treatment",
        "diagnosis": "Foot Rot",
        "medication_administered": "Ceftiofur Antibiotic",
        "dosage": "15ml SC",
        "treatment_date": now.isoformat(),
        "milk_withdrawal_hours": 96,
        "meat_withdrawal_days": 14,
        "veterinarian_name": "Dr. Mark Sloan",
    }
    resp = client.post("/api/v1/health-records", json=payload)
    assert resp.status_code == 201
    data = resp.json()
    assert data["milk_withdrawal_hours"] == 96
    assert data["milk_withdrawal_end"] is not None

    # Verify in active withdrawals endpoint
    act_resp = client.get("/api/v1/health-records/active-withdrawals")
    assert act_resp.status_code == 200
    active_list = act_resp.json()
    assert any(a["cow_id"] == cow_id for a in active_list)


def test_schedule_routine_vet_visit(client):
    cow_resp = client.get("/api/v1/cattle?search=COW-1042")
    assert cow_resp.status_code == 200
    cow_id = cow_resp.json()[0]["id"]

    visit_time = (datetime.now(timezone.utc) + timedelta(days=5)).isoformat()
    sched_payload = {
        "cow_id": cow_id,
        "diagnosis": "Annual Brucellosis Vaccination & Hoof Trimming",
        "scheduled_date": visit_time,
        "veterinarian_name": "Dr. Emily Taylor",
        "notes": "Bring portable ultrasound for pregnancy check",
    }
    resp = client.post("/api/v1/health-records/schedule-visit", json=sched_payload)
    assert resp.status_code == 201
    data = resp.json()
    assert data["status"] == "Scheduled"
    assert data["record_type"] == "Scheduled Visit"
    assert data["scheduled_date"] is not None

    # List schedules
    list_sched = client.get("/api/v1/health-records/schedules")
    assert list_sched.status_code == 200
    schedules = list_sched.json()
    assert any(s["id"] == data["id"] for s in schedules)


def test_bulk_milk_compliance_verification(client):
    # Register cow with active withdrawal
    c_resp = client.post(
        "/api/v1/cattle",
        json={
            "tag_number": "COW-WITHHELD",
            "rfid_tag": "982 000099990002",
            "breed": "Jersey",
            "gender": "Female",
            "date_of_birth": "2022-04-10",
            "status": "Lactating",
        },
    )
    withheld_cow_id = c_resp.json()["id"]

    now = datetime.now(timezone.utc)
    client.post(
        "/api/v1/health-records",
        json={
            "cow_id": withheld_cow_id,
            "record_type": "Treatment",
            "diagnosis": "Metritis",
            "medication_administered": "Oxytetracycline",
            "dosage": "25ml IM",
            "treatment_date": now.isoformat(),
            "milk_withdrawal_hours": 72,
            "meat_withdrawal_days": 28,
            "veterinarian_name": "Dr. Sarah Jenkins",
        },
    )

    # Register clean cow
    c_clean_resp = client.post(
        "/api/v1/cattle",
        json={
            "tag_number": "COW-CLEAN",
            "rfid_tag": "982 000099990003",
            "breed": "Brown Swiss",
            "gender": "Female",
            "date_of_birth": "2022-04-10",
            "status": "Lactating",
        },
    )
    clean_cow_id = c_clean_resp.json()["id"]

    # Verify batch with ONLY clean cow -> Compliant
    verify_clean = client.post(
        "/api/v1/health-records/verify-bulk-milk",
        json={"cow_ids": [clean_cow_id]},
    )
    assert verify_clean.status_code == 200
    assert verify_clean.json()["compliant"] is True

    # Verify batch including withheld cow -> 400 Compliance Block
    verify_blocked = client.post(
        "/api/v1/health-records/verify-bulk-milk",
        json={"cow_ids": [clean_cow_id, withheld_cow_id]},
    )
    assert verify_blocked.status_code == 400
    detail = verify_blocked.json()["detail"]
    assert "Compliance Block" in detail["error"]
    assert withheld_cow_id in detail["blocked_cow_ids"]
