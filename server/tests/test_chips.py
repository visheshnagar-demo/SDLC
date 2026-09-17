def test_create_chip_definition(client):
    response = client.post(
        "/api/v1/chips",
        json={"name": "VIP Platinum 1000", "category": "VIP", "face_value": 1000.0},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "VIP Platinum 1000"
    assert data["category"] == "VIP"
    assert data["face_value"] == 1000.0
    assert data["status"] == "ACTIVE"
    assert "id" in data


def test_create_duplicate_chip_definition_fails(client):
    response = client.post(
        "/api/v1/chips",
        json={"name": "VIP Platinum 1000", "category": "VIP", "face_value": 1000.0},
    )
    assert response.status_code == 400


def test_list_chips(client):
    response = client.get("/api/v1/chips")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1


def test_add_inventory_batch(client):
    # First create a chip
    chip_resp = client.post(
        "/api/v1/chips",
        json={"name": "Promo Silver 50", "category": "Promo", "face_value": 50.0},
    )
    chip_id = chip_resp.json()["id"]

    batch_resp = client.post(
        f"/api/v1/chips/{chip_id}/batches",
        json={"batch_number": "BATCH-SILVER-001", "total_quantity": 5000},
    )
    assert batch_resp.status_code == 201
    batch_data = batch_resp.json()
    assert batch_data["chip_id"] == chip_id
    assert batch_data["total_quantity"] == 5000
    assert batch_data["available_quantity"] == 5000


def test_update_chip_status(client):
    chip_resp = client.post(
        "/api/v1/chips",
        json={"name": "Retired Gold 10", "category": "Standard", "face_value": 10.0},
    )
    chip_id = chip_resp.json()["id"]

    status_resp = client.patch(
        f"/api/v1/chips/{chip_id}/status", json={"status": "RETIRED"}
    )
    assert status_resp.status_code == 200
    assert status_resp.json()["status"] == "RETIRED"
