def test_health_check(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_create_and_get_item(client):
    payload = {
        "sku": "SKU-9901",
        "name": "Tactical Radio",
        "category": "Electronics",
        "unit_price": 250.0,
        "reorder_threshold": 10,
        "reorder_quantity": 50,
    }
    response = client.post("/api/v1/items", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["sku"] == "SKU-9901"
    assert data["name"] == "Tactical Radio"
    item_id = data["id"]

    # Retrieve item
    get_res = client.get(f"/api/v1/items/{item_id}")
    assert get_res.status_code == 200
    assert get_res.json()["sku"] == "SKU-9901"


def test_duplicate_sku(client):
    payload = {
        "sku": "SKU-9901",
        "name": "Duplicate Radio",
        "unit_price": 200.0,
        "reorder_threshold": 5,
        "reorder_quantity": 20,
    }
    response = client.post("/api/v1/items", json=payload)
    assert response.status_code == 400


def test_update_item(client):
    # Create item
    res = client.post(
        "/api/v1/items",
        json={
            "sku": "SKU-TEST-UPD",
            "name": "Update Me",
            "unit_price": 100.0,
            "reorder_threshold": 5,
            "reorder_quantity": 25,
        },
    )
    item_id = res.json()["id"]

    # Update item
    upd_res = client.put(
        f"/api/v1/items/{item_id}", json={"name": "Updated Name", "unit_price": 120.0}
    )
    assert upd_res.status_code == 200
    assert upd_res.json()["name"] == "Updated Name"
    assert upd_res.json()["unit_price"] == 120.0
