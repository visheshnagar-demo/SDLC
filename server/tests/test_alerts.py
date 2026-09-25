def test_threshold_creation_and_validation(client):
    tank_res = client.post(
        "/api/v1/tanks",
        json={
            "name": "Threshold Testing Tank",
            "location": "Zone C",
            "capacity_liters": 400.0,
            "water_type": "Freshwater",
        },
    )
    tank_id = tank_res.json()["id"]

    # Invalid threshold: min >= max
    res_invalid = client.post(
        "/api/v1/thresholds",
        json={
            "tank_id": tank_id,
            "parameter_name": "ph_level",
            "min_threshold": 8.0,
            "max_threshold": 7.0,
        },
    )
    assert res_invalid.status_code == 400

    # Valid threshold
    res_valid = client.post(
        "/api/v1/thresholds",
        json={
            "tank_id": tank_id,
            "parameter_name": "ph_level",
            "min_threshold": 6.8,
            "max_threshold": 7.6,
        },
    )
    assert res_valid.status_code == 201
    assert res_valid.json()["min_threshold"] == 6.8


def test_alert_generation_on_parameter_breach(client):
    tank_res = client.post(
        "/api/v1/tanks",
        json={
            "name": "Breach Alert Tank",
            "location": "Zone D",
            "capacity_liters": 600.0,
            "water_type": "Saltwater",
        },
    )
    tank_id = tank_res.json()["id"]

    # Set custom strict thresholds
    client.post(
        "/api/v1/thresholds",
        json={
            "tank_id": tank_id,
            "parameter_name": "dissolved_oxygen",
            "min_threshold": 6.0,
            "max_threshold": 9.0,
        },
    )

    # Ingest telemetry with critical low DO (e.g. 4.2 mg/L)
    client.post(
        "/api/v1/telemetry",
        json={
            "tank_id": tank_id,
            "ph_level": 8.2,
            "dissolved_oxygen": 4.2,
            "temperature_c": 25.0,
            "ammonia_ppm": 0.01,
        },
    )

    # Check that alert was generated
    alerts_res = client.get(f"/api/v1/alerts?tank_id={tank_id}&status=ACTIVE")
    assert alerts_res.status_code == 200
    alerts = alerts_res.json()
    assert len(alerts) >= 1
    alert = next(a for a in alerts if a["parameter_name"] == "dissolved_oxygen")
    assert alert["severity"] in ["CRITICAL", "WARNING"]
    assert alert["threshold_violated"] == "MIN"
    assert alert["status"] == "ACTIVE"

    # Acknowledge alert
    ack_res = client.patch(
        f"/api/v1/alerts/{alert['id']}/status",
        json={"status": "ACKNOWLEDGED"},
    )
    assert ack_res.status_code == 200
    assert ack_res.json()["status"] == "ACKNOWLEDGED"
    assert ack_res.json()["acknowledged_at"] is not None

    # Resolve alert
    res_res = client.patch(
        f"/api/v1/alerts/{alert['id']}/status",
        json={"status": "RESOLVED"},
    )
    assert res_res.status_code == 200
    assert res_res.json()["status"] == "RESOLVED"
    assert res_res.json()["resolved_at"] is not None
