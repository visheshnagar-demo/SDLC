def test_list_and_create_warehouse(client):
    # Warehouses should include seeded ones WH-MAIN and WH-WEST
    res = client.get("/api/v1/warehouses")
    assert res.status_code == 200
    warehouses = res.json()
    assert len(warehouses) >= 2

    # Create new warehouse
    new_wh = {
        "code": "WH-EAST",
        "name": "East Coast Depot",
        "location": "Building C, East Sector",
    }
    create_res = client.post("/api/v1/warehouses", json=new_wh)
    assert create_res.status_code == 201
    assert create_res.json()["code"] == "WH-EAST"

    # Get warehouse by ID/code
    get_res = client.get("/api/v1/warehouses/WH-EAST")
    assert get_res.status_code == 200
    assert get_res.json()["name"] == "East Coast Depot"
