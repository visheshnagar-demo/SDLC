from datetime import date, timedelta


def test_list_health_records(client, worker_headers):
    response = client.get("/api/v1/health-records", headers=worker_headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)


def test_create_health_record_manager(client, admin_headers, worker_headers):
    # Get a cow id
    cows_res = client.get("/api/v1/cows", headers=worker_headers)
    cow_id = cows_res.json()[0]["id"]

    payload = {
        "cow_id": cow_id,
        "record_type": "Vaccination",
        "title": "Annual Anthrax Booster",
        "diagnosis": "Preventative routine care",
        "treatment_plan": "1ml subcutaneous injection",
        "event_date": date.today().isoformat(),
        "next_due_date": (date.today() + timedelta(days=365)).isoformat(),
        "administered_by": "Dr. Sarah Jenkins",
    }
    response = client.post(
        "/api/v1/health-records", json=payload, headers=admin_headers
    )
    assert response.status_code == 201
    data = response.json()
    assert data["cow_id"] == cow_id
    assert data["title"] == "Annual Anthrax Booster"
    assert data["record_type"] == "Vaccination"


def test_create_health_record_worker_forbidden(client, worker_headers):
    cows_res = client.get("/api/v1/cows", headers=worker_headers)
    cow_id = cows_res.json()[0]["id"]

    payload = {
        "cow_id": cow_id,
        "record_type": "Checkup",
        "title": "Routine inspection",
        "event_date": date.today().isoformat(),
        "administered_by": "Worker Joe",
    }
    response = client.post(
        "/api/v1/health-records", json=payload, headers=worker_headers
    )
    assert response.status_code == 403


def test_create_health_record_invalid_cow_fails(client, admin_headers):
    payload = {
        "cow_id": "non-existent-uuid",
        "record_type": "Checkup",
        "title": "Routine inspection",
        "event_date": date.today().isoformat(),
        "administered_by": "Dr. Sarah",
    }
    response = client.post(
        "/api/v1/health-records", json=payload, headers=admin_headers
    )
    assert response.status_code == 404


def test_create_health_record_future_date_fails(client, admin_headers, worker_headers):
    cows_res = client.get("/api/v1/cows", headers=worker_headers)
    cow_id = cows_res.json()[0]["id"]

    payload = {
        "cow_id": cow_id,
        "record_type": "Treatment",
        "title": "Future Medical Event",
        "event_date": (date.today() + timedelta(days=5)).isoformat(),
        "administered_by": "Dr. Sarah",
    }
    response = client.post(
        "/api/v1/health-records", json=payload, headers=admin_headers
    )
    assert response.status_code == 400
    assert "cannot be in the future" in response.json()["detail"]
