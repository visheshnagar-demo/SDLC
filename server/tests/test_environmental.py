def test_list_readings(client):
    response = client.get("/api/v1/environmental-readings")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 2


def test_ingest_reading_normal(client):
    # Gallery 1 safe range: 18-22 C, 45-55% RH
    loc_id = "c2a5e4d1-8173-4f56-913a-34567890abcd"
    payload = {
        "location_id": loc_id,
        "temperature_celsius": 20.0,
        "humidity_percentage": 50.0
    }
    resp = client.post("/api/v1/environmental-readings", json=payload)
    assert resp.status_code == 201
    data = resp.json()
    assert data["is_breach"] is False
    assert data["breach_details"] is None


def test_ingest_reading_breach(client):
    # Storage Vault A safe range: 16-19 C, 40-50% RH
    loc_id = "e7b8c9d0-1234-5678-9abc-def012345678"
    payload = {
        "location_id": loc_id,
        "temperature_celsius": 24.5,
        "humidity_percentage": 68.2
    }
    resp = client.post("/api/v1/environmental-readings", json=payload)
    assert resp.status_code == 201
    data = resp.json()
    assert data["is_breach"] is True
    assert "exceeds max" in data["breach_details"]


def test_sensor_summary_and_breach_detection(client):
    resp = client.get("/api/v1/environmental-readings/summary/sensor-status")
    assert resp.status_code == 200
    summary = resp.json()
    assert "total_sensors" in summary
    assert "online_sensors" in summary
    assert "active_breaches" in summary
