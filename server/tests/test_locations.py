def test_list_locations(client):
    response = client.get("/api/v1/locations")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 4
    names = [loc["name"] for loc in data]
    assert any("Gallery 3" in n for n in names)


def test_create_and_get_location(client):
    payload = {
        "name": "Storage Vault B (Metals)",
        "zone_type": "Storage Vault",
        "temp_min_celsius": 17.0,
        "temp_max_celsius": 21.0,
        "humidity_min_percent": 30.0,
        "humidity_max_percent": 40.0
    }
    create_resp = client.post("/api/v1/locations", json=payload)
    assert create_resp.status_code == 201
    created = create_resp.json()
    assert created["name"] == payload["name"]
    loc_id = created["id"]

    get_resp = client.get(f"/api/v1/locations/{loc_id}")
    assert get_resp.status_code == 200
    assert get_resp.json()["id"] == loc_id


def test_get_nonexistent_location(client):
    response = client.get("/api/v1/locations/00000000-0000-0000-0000-000000000000")
    assert response.status_code == 404
