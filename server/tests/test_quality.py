def test_get_quality_overview(client):
    response = client.get("/api/v1/quality")
    assert response.status_code == 200
    data = response.json()
    assert "average_ph" in data
    assert "average_turbidity_ntu" in data
    assert "average_tds_ppm" in data
    assert "overall_pass_status" in data
    assert "active_filtration_units" in data
    assert "metrics" in data
    assert "recent_backwash_logs" in data


def test_trigger_backwash(client):
    payload = {
        "tank_id": "tank_a1b2c3d4",
        "unit_name": "Filtration Unit 1",
        "triggered_by": "MANUAL",
        "notes": "Routine filter backwash maintenance.",
    }
    response = client.post("/api/v1/quality/backwash", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["tank_id"] == "tank_a1b2c3d4"
    assert data["unit_name"] == "Filtration Unit 1"
    assert data["status"] == "COMPLETED"
    assert data["triggered_by"] == "MANUAL"
    assert "successfully triggered" in data["message"]

    # Verify clean valve is re-opened after backwash
    tank_res = client.get("/api/v1/tanks/tank_a1b2c3d4/status")
    assert tank_res.status_code == 200
    assert tank_res.json()["clean_valve_open"] is True


def test_trigger_backwash_nonexistent_tank(client):
    payload = {
        "tank_id": "tank_nonexistent_999",
        "unit_name": "Filtration Unit 1",
    }
    response = client.post("/api/v1/quality/backwash", json=payload)
    assert response.status_code == 404
