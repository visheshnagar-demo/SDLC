from datetime import date, datetime, timezone


def test_list_milk_logs(client):
    response = client.get("/api/v1/milk-logs")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1


def test_create_milk_log_normal(client):
    # Find COW-1042
    cow_resp = client.get("/api/v1/cattle?search=COW-1042")
    assert cow_resp.status_code == 200
    cow_id = cow_resp.json()[0]["id"]

    today = date.today().isoformat()
    payload = {
        "cow_id": cow_id,
        "milking_date": today,
        "session": "Morning",
        "yield_liters": 10.2,
        "fat_percentage": 3.85,
        "protein_percentage": 3.25,
        "somatic_cell_count": 140000,
    }
    response = client.post("/api/v1/milk-logs", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["yield_liters"] == 10.2
    assert data["is_withheld"] is False
    assert data["variance_alert"] is False


def test_create_milk_log_mastitis_variance_alert(client):
    # COW-1042 has past average yield ~ 10.0L per session
    # A yield drop of >30% (e.g. 4.0L) should trigger variance_alert=True
    cow_resp = client.get("/api/v1/cattle?search=COW-1042")
    assert cow_resp.status_code == 200
    cow_id = cow_resp.json()[0]["id"]

    today = date.today().isoformat()
    payload = {
        "cow_id": cow_id,
        "milking_date": today,
        "session": "Evening",
        "yield_liters": 3.5,  # >30% drop vs ~10L avg
        "fat_percentage": 4.1,
        "protein_percentage": 3.5,
        "somatic_cell_count": 450000,
    }
    response = client.post("/api/v1/milk-logs", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["yield_liters"] == 3.5
    assert data["variance_alert"] is True


def test_create_milk_log_with_active_withdrawal(client):
    # Create a fresh cow
    cow_payload = {
        "tag_number": "COW-MED",
        "rfid_tag": "982 000077770001",
        "breed": "Holstein-Friesian",
        "gender": "Female",
        "date_of_birth": "2022-01-01",
        "status": "Lactating",
    }
    c_resp = client.post("/api/v1/cattle", json=cow_payload)
    assert c_resp.status_code == 201
    cow_id = c_resp.json()["id"]

    # Add active health treatment with 48h milk withdrawal
    now = datetime.now(timezone.utc)
    health_payload = {
        "cow_id": cow_id,
        "record_type": "Treatment",
        "diagnosis": "Acute Mastitis",
        "medication_administered": "Penicillin G",
        "dosage": "20ml IM",
        "treatment_date": now.isoformat(),
        "milk_withdrawal_hours": 48,
        "meat_withdrawal_days": 10,
        "veterinarian_name": "Dr. Sarah Jenkins",
    }
    h_resp = client.post("/api/v1/health-records", json=health_payload)
    assert h_resp.status_code == 201

    # Now record a milking log for this cow
    milk_payload = {
        "cow_id": cow_id,
        "milking_date": date.today().isoformat(),
        "session": "Morning",
        "yield_liters": 12.0,
        "fat_percentage": 3.7,
        "protein_percentage": 3.1,
        "somatic_cell_count": 300000,
    }
    m_resp = client.post("/api/v1/milk-logs", json=milk_payload)
    assert m_resp.status_code == 201
    m_data = m_resp.json()
    # is_withheld MUST be True
    assert m_data["is_withheld"] is True


def test_get_milk_summary(client):
    response = client.get("/api/v1/milk-logs/summary")
    assert response.status_code == 200
    data = response.json()
    assert "total_yield" in data
    assert "rolling_7d_yield" in data
    assert "daily_trends" in data
    assert isinstance(data["daily_trends"], list)
    assert len(data["daily_trends"]) == 7
