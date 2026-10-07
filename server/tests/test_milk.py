from datetime import date


def test_list_milk_yields(client, worker_headers):
    response = client.get("/api/v1/milk-yields", headers=worker_headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)


def test_record_milk_yield_worker(client, worker_headers):
    # Fetch COW-1001 (which has 7 days of normal ~25.0L yield seeded)
    cows_res = client.get("/api/v1/cows?search=COW-1001", headers=worker_headers)
    cow = cows_res.json()[0]
    cow_id = cow["id"]

    payload = {
        "cow_id": cow_id,
        "logging_date": date.today().isoformat(),
        "morning_yield_liters": 13.0,
        "evening_yield_liters": 12.0,
        "notes": "Excellent session",
    }
    response = client.post("/api/v1/milk-yields", json=payload, headers=worker_headers)
    assert response.status_code == 201
    data = response.json()
    assert data["cow_id"] == cow_id
    assert data["total_yield_liters"] == 25.0
    assert data["yield_drop_alert"] is False
    assert data["seven_day_average"] is not None


def test_record_milk_yield_drop_alert_triggered(client, worker_headers):
    # Fetch COW-1042 (which has 7 days of ~24.0L yield seeded)
    cows_res = client.get("/api/v1/cows?search=COW-1042", headers=worker_headers)
    cow = cows_res.json()[0]
    cow_id = cow["id"]

    # Record very low yield (e.g. 5.0 + 6.0 = 11.0L, which is < 70% of 24.0L)
    payload = {
        "cow_id": cow_id,
        "logging_date": date.today().isoformat(),
        "morning_yield_liters": 5.0,
        "evening_yield_liters": 6.0,
        "notes": "Significant drop noticed in evening session",
    }
    response = client.post("/api/v1/milk-yields", json=payload, headers=worker_headers)
    assert response.status_code == 201
    data = response.json()
    assert data["cow_id"] == cow_id
    assert data["total_yield_liters"] == 11.0
    assert data["yield_drop_alert"] is True  # Anomaly triggered!


def test_record_milk_yield_negative_fails(client, worker_headers):
    cows_res = client.get("/api/v1/cows", headers=worker_headers)
    cow_id = cows_res.json()[0]["id"]

    payload = {
        "cow_id": cow_id,
        "logging_date": date.today().isoformat(),
        "morning_yield_liters": -5.0,
        "evening_yield_liters": 10.0,
    }
    response = client.post("/api/v1/milk-yields", json=payload, headers=worker_headers)
    assert response.status_code == 400
    assert "cannot be negative" in response.json()["detail"]


def test_record_milk_yield_nonexistent_cow_fails(client, worker_headers):
    payload = {
        "cow_id": "non-existent-cow-uuid",
        "logging_date": date.today().isoformat(),
        "morning_yield_liters": 10.0,
        "evening_yield_liters": 10.0,
    }
    response = client.post("/api/v1/milk-yields", json=payload, headers=worker_headers)
    assert response.status_code == 404
