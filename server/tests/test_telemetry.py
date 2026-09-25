from datetime import datetime, timezone, timedelta


def test_telemetry_ingestion_and_latest(client):
    # Create tank first
    tank_res = client.post(
        "/api/v1/tanks",
        json={
            "name": "Telemetry Monitoring Tank",
            "location": "Lab 1",
            "capacity_liters": 500.0,
            "water_type": "Freshwater",
        },
    )
    assert tank_res.status_code == 201
    tank_id = tank_res.json()["id"]

    # Ingest safe telemetry reading
    now = datetime.now(timezone.utc).isoformat()
    telemetry_payload = {
        "tank_id": tank_id,
        "ph_level": 7.2,
        "dissolved_oxygen": 7.5,
        "temperature_c": 25.0,
        "ammonia_ppm": 0.01,
        "recorded_at": now,
    }
    res = client.post("/api/v1/telemetry", json=telemetry_payload)
    assert res.status_code == 201
    data = res.json()
    assert data["tank_id"] == tank_id
    assert data["ph_level"] == 7.2
    assert data["dissolved_oxygen"] == 7.5

    # Fetch latest telemetry
    res_latest = client.get(f"/api/v1/telemetry/latest?tank_id={tank_id}")
    assert res_latest.status_code == 200
    latest_data = res_latest.json()
    assert latest_data["tank_id"] == tank_id
    assert latest_data["reading"]["ph_level"] == 7.2
    assert latest_data["ph_status"] == "SAFE"
    assert latest_data["oxygen_status"] == "SAFE"
    assert latest_data["temperature_status"] == "SAFE"
    assert latest_data["ammonia_status"] == "SAFE"


def test_telemetry_history_filtering(client):
    tank_res = client.post(
        "/api/v1/tanks",
        json={
            "name": "History Filter Tank",
            "location": "Lab 2",
            "capacity_liters": 800.0,
            "water_type": "Saltwater",
        },
    )
    tank_id = tank_res.json()["id"]

    # Ingest 2 readings at different times
    t1 = (datetime.now(timezone.utc) - timedelta(hours=2)).isoformat()
    t2 = (datetime.now(timezone.utc) - timedelta(minutes=10)).isoformat()

    client.post(
        "/api/v1/telemetry",
        json={
            "tank_id": tank_id,
            "ph_level": 8.2,
            "dissolved_oxygen": 7.0,
            "temperature_c": 25.5,
            "ammonia_ppm": 0.01,
            "recorded_at": t1,
        },
    )
    client.post(
        "/api/v1/telemetry",
        json={
            "tank_id": tank_id,
            "ph_level": 8.3,
            "dissolved_oxygen": 6.9,
            "temperature_c": 25.6,
            "ammonia_ppm": 0.01,
            "recorded_at": t2,
        },
    )

    # Query with tank_id filter
    res = client.get(f"/api/v1/telemetry?tank_id={tank_id}")
    assert res.status_code == 200
    readings = res.json()
    assert len(readings) == 2


def test_telemetry_ingest_invalid_tank(client):
    res = client.post(
        "/api/v1/telemetry",
        json={
            "tank_id": "invalid-tank-id",
            "ph_level": 7.0,
            "dissolved_oxygen": 6.0,
            "temperature_c": 24.0,
            "ammonia_ppm": 0.02,
        },
    )
    assert res.status_code == 404
