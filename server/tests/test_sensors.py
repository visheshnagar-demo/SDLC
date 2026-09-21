def test_ingest_telemetry_normal(client):
    payload = {
        "sensor_id": "sen_normal_lvl",
        "tank_id": "tank_sensor_normal",
        "water_level_liters": 8000.0,
        "flow_rate_lpm": 150.0,
        "ph_level": 7.4,
        "turbidity_ntu": 1.1,
        "tds_ppm": 125.0,
        "precipitation_mm": 10.0,
        "catchment_area_sqm": 500.0,
    }
    response = client.post("/api/v1/sensors/telemetry", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["tank_id"] == "tank_sensor_normal"
    assert data["water_level_liters"] == 8000.0
    assert data["flow_rate_lpm"] == 150.0

    # Verify tank volume and status updated
    tank_res = client.get("/api/v1/tanks/tank_sensor_normal/status")
    assert tank_res.status_code == 200
    tank_data = tank_res.json()
    assert tank_data["current_volume_liters"] == 8000.0
    assert tank_data["fill_percentage"] == 80.0


def test_ingest_telemetry_quality_failure(client):
    payload = {
        "sensor_id": "sen_qual_fail",
        "tank_id": "tank_sensor_qual",
        "water_level_liters": 7500.0,
        "flow_rate_lpm": 120.0,
        "ph_level": 5.8,  # Invalid pH (< 6.5)
        "turbidity_ntu": 4.5,  # Exceeds 2.0 NTU threshold
        "tds_ppm": 200.0,
    }
    response = client.post("/api/v1/sensors/telemetry", json=payload)
    assert response.status_code == 201

    # Verify clean_valve_open is set to False on tank due to quality failure
    tank_res = client.get("/api/v1/tanks/tank_sensor_qual/status")
    assert tank_res.status_code == 200
    tank_data = tank_res.json()
    assert tank_data["clean_valve_open"] is False

    # Check that a HIGH severity alert was generated for quality failure
    alerts_res = client.get("/api/v1/alerts?tank_id=tank_sensor_qual&severity=HIGH")
    assert alerts_res.status_code == 200
    alerts = alerts_res.json()
    assert len(alerts) >= 1
    assert "Water quality failed" in alerts[0]["message"]


def test_ingest_telemetry_overflow_threshold(client):
    payload = {
        "sensor_id": "sen_overflow_lvl",
        "tank_id": "tank_sensor_overflow",
        "water_level_liters": 9900.0,  # 99% capacity (> 98%)
        "flow_rate_lpm": 200.0,
        "ph_level": 7.2,
        "turbidity_ntu": 1.0,
    }
    response = client.post("/api/v1/sensors/telemetry", json=payload)
    assert response.status_code == 201

    tank_res = client.get("/api/v1/tanks/tank_sensor_overflow/status")
    assert tank_res.status_code == 200
    tank_data = tank_res.json()
    assert tank_data["overflow_valve_open"] is True
    assert tank_data["status"] == "OVERFLOW"


def test_ingest_telemetry_low_level_threshold(client):
    payload = {
        "sensor_id": "sen_low_lvl",
        "tank_id": "tank_sensor_low",
        "water_level_liters": 500.0,  # 5% capacity (< 10%)
        "flow_rate_lpm": 0.0,
        "ph_level": 7.2,
        "turbidity_ntu": 1.0,
    }
    response = client.post("/api/v1/sensors/telemetry", json=payload)
    assert response.status_code == 201

    tank_res = client.get("/api/v1/tanks/tank_sensor_low/status")
    assert tank_res.status_code == 200
    tank_data = tank_res.json()
    assert tank_data["supply_pump_active"] is False
    assert tank_data["municipal_backup_active"] is True
    assert tank_data["status"] == "WARNING"
