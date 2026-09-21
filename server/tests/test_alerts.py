def test_list_alerts(client):
    response = client.get("/api/v1/alerts")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 2  # Seeded 2 alerts
    severities = [a["severity"] for a in data]
    assert "MEDIUM" in severities or "WARNING" in severities


def test_create_alert(client):
    payload = {
        "tank_id": "tank_a1b2c3d4",
        "severity": "HIGH",
        "category": "HARDWARE",
        "message": "Pressure drop detected in Primary Inlet Pipe. Inspect connections.",
    }
    response = client.post("/api/v1/alerts", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["tank_id"] == "tank_a1b2c3d4"
    assert data["severity"] == "HIGH"
    assert data["category"] == "HARDWARE"
    assert data["is_acknowledged"] is False


def test_acknowledge_alert(client):
    # Acknowledge unacknowledged seeded alert alt_001
    response = client.post("/api/v1/alerts/alt_001/acknowledge")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == "alt_001"
    assert data["is_acknowledged"] is True


def test_acknowledge_nonexistent_alert(client):
    response = client.post("/api/v1/alerts/alt_nonexistent_999/acknowledge")
    assert response.status_code == 404
