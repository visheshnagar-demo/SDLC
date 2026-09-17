def test_create_chip(client):
    payload = {
        "name": "Platinum 1000",
        "category": "VIP",
        "face_value": 1000.0,
        "status": "active",
    }
    response = client.post("/api/v1/chips", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Platinum 1000"
    assert data["face_value"] == 1000.0
    assert "id" in data


def test_list_chips(client):
    response = client.get("/api/v1/chips")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1


def test_add_batch_and_get_chip(client):
    # 1. Create chip
    res = client.post(
        "/api/v1/chips",
        json={
            "name": "Silver 50",
            "category": "Standard",
            "face_value": 50.0,
            "status": "active",
        },
    )
    chip_id = res.json()["id"]

    # 2. Add batch
    batch_payload = {
        "batch_number": "BATCH-SILVER-001",
        "total_quantity": 5000,
        "status": "active",
    }
    batch_res = client.post(f"/api/v1/chips/{chip_id}/batches", json=batch_payload)
    assert batch_res.status_code == 201
    batch_data = batch_res.json()
    assert batch_data["available_quantity"] == 5000

    # 3. Get chip detail
    get_res = client.get(f"/api/v1/chips/{chip_id}")
    assert get_res.status_code == 200
    get_data = get_res.json()
    assert get_data["chip"]["name"] == "Silver 50"
    assert get_data["chip"]["total_stock"] == 5000
    assert len(get_data["batches"]) == 1


def test_update_chip_status(client):
    res = client.post(
        "/api/v1/chips",
        json={
            "name": "Bronze 10",
            "category": "Basic",
            "face_value": 10.0,
            "status": "active",
        },
    )
    chip_id = res.json()["id"]

    patch_res = client.patch(
        f"/api/v1/chips/{chip_id}/status", json={"status": "retired"}
    )
    assert patch_res.status_code == 200
    assert patch_res.json()["status"] == "retired"
