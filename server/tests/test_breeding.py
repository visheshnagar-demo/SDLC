from datetime import date, timedelta


def test_list_breeding_records(client):
    response = client.get("/api/v1/breeding-records")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1


def test_create_breeding_insemination_and_gestation(client):
    # Register a new heifer
    cow_payload = {
        "tag_number": "COW-BREED1",
        "rfid_tag": "982 000088880001",
        "breed": "Holstein-Friesian",
        "gender": "Female",
        "date_of_birth": "2023-02-01",
        "status": "Active",
    }
    cow_resp = client.post("/api/v1/cattle", json=cow_payload)
    assert cow_resp.status_code == 201
    cow_id = cow_resp.json()["id"]

    event_date = date(2025, 6, 1)
    payload = {
        "cow_id": cow_id,
        "stage": "Inseminated",
        "event_date": event_date.isoformat(),
        "insemination_date": event_date.isoformat(),
        "sire_rfid_or_code": "982 000000890002",
        "notes": "Artificial Insemination with Sire BULL-0089",
    }
    resp = client.post("/api/v1/breeding-records", json=payload)
    assert resp.status_code == 201
    data = resp.json()

    # 44-day gestation check: 2025-06-01 + 44 days = 2025-07-15
    expected_check = (event_date + timedelta(days=44)).isoformat()
    # 283-day expected calving: 2025-06-01 + 283 days = 2026-03-11
    expected_calving = (event_date + timedelta(days=283)).isoformat()

    assert data["gestation_check_due_date"] == expected_check
    assert data["expected_calving_date"] == expected_calving
    assert data["stage"] == "Inseminated"

    # Verify cow status updated to Inseminated
    cow_check = client.get(f"/api/v1/cattle/{cow_id}")
    assert cow_check.status_code == 200
    assert cow_check.json()["status"] == "Inseminated"


def test_breeding_cycle_reset_on_heat(client):
    # Register heifer
    cow_payload = {
        "tag_number": "COW-BREED2",
        "rfid_tag": "982 000088880002",
        "breed": "Jersey",
        "gender": "Female",
        "date_of_birth": "2023-03-01",
        "status": "Active",
    }
    cow_resp = client.post("/api/v1/cattle", json=cow_payload)
    assert cow_resp.status_code == 201
    cow_id = cow_resp.json()["id"]

    # Inseminate
    client.post(
        "/api/v1/breeding-records",
        json={
            "cow_id": cow_id,
            "stage": "Inseminated",
            "event_date": "2025-05-01",
            "insemination_date": "2025-05-01",
        },
    )

    # Returns to Heat (failed conception)
    heat_resp = client.post(
        "/api/v1/breeding-records",
        json={
            "cow_id": cow_id,
            "stage": "In Heat",
            "event_date": "2025-05-22",
            "notes": "Cow returned to standing heat after 21 days",
        },
    )
    assert heat_resp.status_code == 201

    # Cow status reset to Active
    cow_check = client.get(f"/api/v1/cattle/{cow_id}")
    assert cow_check.status_code == 200
    assert cow_check.json()["status"] == "Active"


def test_update_breeding_record(client):
    records_resp = client.get("/api/v1/breeding-records")
    assert records_resp.status_code == 200
    records = records_resp.json()
    record_id = records[0]["id"]

    update_resp = client.put(
        f"/api/v1/breeding-records/{record_id}",
        json={"notes": "Updated note with veterinary confirmation"},
    )
    assert update_resp.status_code == 200
    assert "Updated note" in update_resp.json()["notes"]
