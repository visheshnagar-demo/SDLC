def test_get_yield_analytics(client):
    response = client.get("/api/v1/analytics/yield")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    assert data[0]["catchment_area_sqm"] == 500.0
    assert data[0]["precipitation_mm"] == 25.0
    assert data[0]["harvested_liters"] == 11250.0


def test_calculate_yield_forecast(client):
    payload = {
        "catchment_area_sqm": 500.0,
        "precipitation_mm": 25.0,
        "efficiency_factor": 0.9,
    }
    response = client.post("/api/v1/analytics/calculate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["catchment_area_sqm"] == 500.0
    assert data["precipitation_mm"] == 25.0
    assert data["efficiency_factor"] == 0.9
    assert data["estimated_harvested_liters"] == 11250.0  # 500 * 25 * 0.9 = 11250 L


def test_calculate_yield_forecast_default_efficiency(client):
    payload = {
        "catchment_area_sqm": 1000.0,
        "precipitation_mm": 10.0,
    }
    response = client.post("/api/v1/analytics/calculate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["efficiency_factor"] == 0.9
    assert data["estimated_harvested_liters"] == 9000.0  # 1000 * 10 * 0.9 = 9000 L
