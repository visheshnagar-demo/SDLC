def test_list_cattle(client):
    response = client.get("/api/v1/cattle")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 3
    # Check that COW-1042 is present from seed
    tag_numbers = [c["tag_number"] for c in data]
    assert "COW-1042" in tag_numbers


def test_list_cattle_filters(client):
    # Filter by breed
    response = client.get("/api/v1/cattle?breed=Jersey")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1
    assert all("Jersey" in c["breed"] for c in data)

    # Search keyword
    response = client.get("/api/v1/cattle?search=1042")
    assert response.status_code == 200
    data = response.json()
    assert any(c["tag_number"] == "COW-1042" for c in data)


def test_create_cattle_success(client):
    payload = {
        "tag_number": "COW-2001",
        "rfid_tag": "982 000020010001",
        "breed": "Holstein-Friesian",
        "gender": "Female",
        "date_of_birth": "2023-05-10",
        "status": "Active",
    }
    response = client.post("/api/v1/cattle", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["tag_number"] == "COW-2001"
    assert data["rfid_tag"] == "982 000020010001"
    assert "id" in data


def test_create_cattle_duplicate_rfid_fails(client):
    # Attempt to register duplicate RFID tag
    payload = {
        "tag_number": "COW-9999",
        "rfid_tag": "982 000010428912",  # Already assigned to COW-1042
        "breed": "Holstein-Friesian",
        "gender": "Female",
        "date_of_birth": "2023-01-01",
        "status": "Active",
    }
    response = client.post("/api/v1/cattle", json=payload)
    assert response.status_code == 400
    assert "RFID tag already assigned" in response.json()["detail"]


def test_create_cattle_duplicate_tag_number_fails(client):
    payload = {
        "tag_number": "COW-1042",  # Already exists
        "rfid_tag": "982 999999999999",
        "breed": "Jersey",
        "gender": "Female",
        "date_of_birth": "2023-01-01",
        "status": "Active",
    }
    response = client.post("/api/v1/cattle", json=payload)
    assert response.status_code == 400
    assert "Tag number already registered" in response.json()["detail"]


def test_get_cattle_detail(client):
    # Get COW-1042 ID
    list_resp = client.get("/api/v1/cattle?search=COW-1042")
    assert list_resp.status_code == 200
    cow_id = list_resp.json()[0]["id"]

    resp = client.get(f"/api/v1/cattle/{cow_id}")
    assert resp.status_code == 200
    detail = resp.json()
    assert detail["tag_number"] == "COW-1042"
    assert "recent_milk_logs" in detail
    assert "recent_breeding_records" in detail
    assert "recent_health_records" in detail
    assert "has_active_withdrawal" in detail


def test_get_cattle_not_found(client):
    resp = client.get("/api/v1/cattle/non-existent-uuid")
    assert resp.status_code == 404


def test_update_cattle(client):
    list_resp = client.get("/api/v1/cattle?search=COW-1043")
    assert list_resp.status_code == 200
    cow_id = list_resp.json()[0]["id"]

    update_payload = {"status": "Dry"}
    put_resp = client.put(f"/api/v1/cattle/{cow_id}", json=update_payload)
    assert put_resp.status_code == 200
    assert put_resp.json()["status"] == "Dry"


def test_delete_cattle(client):
    # Create temp cow to delete
    create_payload = {
        "tag_number": "COW-DELETE",
        "rfid_tag": "982 000000000099",
        "breed": "Jersey",
        "gender": "Female",
        "date_of_birth": "2023-01-01",
        "status": "Active",
    }
    create_resp = client.post("/api/v1/cattle", json=create_payload)
    assert create_resp.status_code == 201
    cow_id = create_resp.json()["id"]

    del_resp = client.delete(f"/api/v1/cattle/{cow_id}")
    assert del_resp.status_code == 204

    # Verify not found
    get_resp = client.get(f"/api/v1/cattle/{cow_id}")
    assert get_resp.status_code == 404
