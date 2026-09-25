def test_create_and_get_tank(client):
    # Create tank
    payload = {
        "name": "Coral Reef Test Tank",
        "location": "Aquarium Hall A",
        "capacity_liters": 1200.0,
        "water_type": "Saltwater",
    }
    res = client.post("/api/v1/tanks", json=payload)
    assert res.status_code == 201
    data = res.json()
    assert data["name"] == payload["name"]
    assert data["capacity_liters"] == 1200.0
    tank_id = data["id"]

    # Get tank by id
    res_get = client.get(f"/api/v1/tanks/{tank_id}")
    assert res_get.status_code == 200
    assert res_get.json()["id"] == tank_id

    # List tanks
    res_list = client.get("/api/v1/tanks")
    assert res_list.status_code == 200
    tanks = res_list.json()
    assert any(t["id"] == tank_id for t in tanks)


def test_get_nonexistent_tank(client):
    res = client.get("/api/v1/tanks/non-existent-tank-id")
    assert res.status_code == 404
    assert "not found" in res.json()["detail"].lower()


def test_update_and_delete_tank(client):
    payload = {
        "name": "Amazon Biotope",
        "location": "Freshwater Wing",
        "capacity_liters": 600.0,
        "water_type": "Freshwater",
    }
    res = client.post("/api/v1/tanks", json=payload)
    assert res.status_code == 201
    tank_id = res.json()["id"]

    # Update tank
    res_update = client.patch(f"/api/v1/tanks/{tank_id}", json={"name": "Amazon Biotope Deluxe"})
    assert res_update.status_code == 200
    assert res_update.json()["name"] == "Amazon Biotope Deluxe"

    # Delete tank
    res_del = client.delete(f"/api/v1/tanks/{tank_id}")
    assert res_del.status_code == 204

    # Verify deleted
    res_check = client.get(f"/api/v1/tanks/{tank_id}")
    assert res_check.status_code == 404
