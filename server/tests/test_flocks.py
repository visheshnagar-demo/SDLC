def test_create_flock_success(client):
    payload = {
        "name": "Flock A-101",
        "breed": "Rhode Island Red",
        "hatch_date": "2025-01-10",
        "initial_count": 500,
        "coop_location": "Coop #1",
    }
    response = client.post("/api/v1/flocks", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Flock A-101"
    assert data["breed"] == "Rhode Island Red"
    assert data["initial_count"] == 500
    assert data["active_count"] == 500
    assert data["status"] == "ACTIVE"
    assert "id" in data


def test_create_flock_zero_count(client):
    payload = {
        "name": "Flock Invalid",
        "breed": "Leghorn",
        "hatch_date": "2025-01-10",
        "initial_count": 0,
        "coop_location": "Coop #2",
    }
    response = client.post("/api/v1/flocks", json=payload)
    assert response.status_code == 400
    assert "Initial hen count must be greater than zero." in response.json()["detail"]


def test_create_flock_negative_count(client):
    payload = {
        "name": "Flock Invalid Negative",
        "breed": "Leghorn",
        "hatch_date": "2025-01-10",
        "initial_count": -10,
        "coop_location": "Coop #2",
    }
    response = client.post("/api/v1/flocks", json=payload)
    assert response.status_code == 400


def test_list_and_get_flocks(client):
    # Create a flock
    create_res = client.post(
        "/api/v1/flocks",
        json={
            "name": "Flock B-202",
            "breed": "Sussex",
            "hatch_date": "2025-02-01",
            "initial_count": 300,
            "coop_location": "Coop #2",
        },
    )
    flock_id = create_res.json()["id"]

    # List
    list_res = client.get("/api/v1/flocks")
    assert list_res.status_code == 200
    items = list_res.json()
    assert any(f["id"] == flock_id for f in items)

    # Filter by status
    list_active = client.get("/api/v1/flocks?status_filter=ACTIVE")
    assert list_active.status_code == 200

    # Get by ID
    get_res = client.get(f"/api/v1/flocks/{flock_id}")
    assert get_res.status_code == 200
    assert get_res.json()["name"] == "Flock B-202"

    # Get invalid ID
    notFound_res = client.get("/api/v1/flocks/non-existent-id")
    assert notFound_res.status_code == 404


def test_update_and_archive_flock(client):
    create_res = client.post(
        "/api/v1/flocks",
        json={
            "name": "Flock C-303",
            "breed": "Plymouth Rock",
            "hatch_date": "2025-03-01",
            "initial_count": 200,
            "coop_location": "Coop #3",
        },
    )
    flock_id = create_res.json()["id"]

    # Update
    update_res = client.put(
        f"/api/v1/flocks/{flock_id}",
        json={"name": "Flock C-303 Updated", "coop_location": "Coop #3B"},
    )
    assert update_res.status_code == 200
    assert update_res.json()["name"] == "Flock C-303 Updated"
    assert update_res.json()["coop_location"] == "Coop #3B"

    # Archive
    status_res = client.patch(
        f"/api/v1/flocks/{flock_id}/status",
        json={"status": "ARCHIVED"},
    )
    assert status_res.status_code == 200
    assert status_res.json()["status"] == "ARCHIVED"
