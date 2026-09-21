def test_list_warehouses(client):
    response = client.get("/api/v1/warehouses")
    assert response.status_code == 200
    warehouses = response.json()
    assert isinstance(warehouses, list)
    assert len(warehouses) >= 1  # seeded main warehouse


def test_create_and_get_warehouse(client):
    payload = {
        "code": "WH-NORTH",
        "name": "North Precinct Depot",
        "location": "Sector 4",
    }
    res_create = client.post("/api/v1/warehouses", json=payload)
    assert res_create.status_code == 201
    wh = res_create.json()
    assert wh["code"] == "WH-NORTH"
    wh_id = wh["id"]

    res_get = client.get(f"/api/v1/warehouses/{wh_id}")
    assert res_get.status_code == 200
    assert res_get.json()["name"] == "North Precinct Depot"
