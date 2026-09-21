def test_list_tanks(client):
    response = client.get("/api/v1/tanks")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 3  # Seeded 3 tanks
    tank_names = [t["name"] for t in data]
    assert "Storage Tank A" in tank_names
    assert "Storage Tank B" in tank_names
    assert "Storage Tank C" in tank_names


def test_create_tank(client):
    payload = {
        "name": "Storage Tank D",
        "location": "West Courtyard",
        "total_capacity_liters": 12000.0,
        "current_volume_liters": 6000.0,
    }
    response = client.post("/api/v1/tanks", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Storage Tank D"
    assert data["location"] == "West Courtyard"
    assert data["total_capacity_liters"] == 12000.0
    assert data["current_volume_liters"] == 6000.0
    assert data["fill_percentage"] == 50.0


def test_get_tank_status(client):
    # Retrieve status for seeded Tank A
    response = client.get("/api/v1/tanks/tank_a1b2c3d4/status")
    assert response.status_code == 200
    data = response.json()
    assert data["tank_id"] == "tank_a1b2c3d4"
    assert data["name"] == "Storage Tank A"
    assert data["fill_percentage"] == 75.0
    assert "head_pressure_psi" in data
    assert "water_temp_c" in data
    assert "clean_valve_open" in data


def test_get_nonexistent_tank_status(client):
    response = client.get("/api/v1/tanks/tank_nonexistent_999/status")
    assert response.status_code == 404
