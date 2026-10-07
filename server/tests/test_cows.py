from datetime import date, timedelta


def test_list_cows_worker(client, worker_headers):
    response = client.get("/api/v1/cows", headers=worker_headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 2


def test_list_cows_unauthenticated_fails(client):
    response = client.get("/api/v1/cows")
    assert response.status_code == 401


def test_create_cow_manager_success(client, admin_headers):
    payload = {
        "tag_id": "COW-9999",
        "breed": "Guernsey",
        "date_of_birth": (date.today() - timedelta(days=400)).isoformat(),
        "gender": "Female",
        "health_status": "Healthy",
        "weight_kg": 520.5,
        "location": "Barn C",
    }
    response = client.post("/api/v1/cows", json=payload, headers=admin_headers)
    assert response.status_code == 201
    data = response.json()
    assert data["tag_id"] == "COW-9999"
    assert data["breed"] == "Guernsey"
    assert data["weight_kg"] == 520.5


def test_create_cow_worker_forbidden(client, worker_headers):
    payload = {
        "tag_id": "COW-8888",
        "breed": "Jersey",
        "date_of_birth": (date.today() - timedelta(days=300)).isoformat(),
        "gender": "Female",
        "health_status": "Healthy",
        "weight_kg": 480.0,
        "location": "Pasture 1",
    }
    response = client.post("/api/v1/cows", json=payload, headers=worker_headers)
    assert response.status_code == 403


def test_create_cow_duplicate_tag_fails(client, admin_headers):
    payload = {
        "tag_id": "COW-1001",  # already seeded
        "breed": "Holstein",
        "date_of_birth": (date.today() - timedelta(days=500)).isoformat(),
        "gender": "Female",
        "health_status": "Healthy",
        "weight_kg": 600.0,
        "location": "Barn A",
    }
    response = client.post("/api/v1/cows", json=payload, headers=admin_headers)
    assert response.status_code == 400
    assert "already exists" in response.json()["detail"]


def test_create_cow_future_dob_fails(client, admin_headers):
    payload = {
        "tag_id": "COW-7777",
        "breed": "Holstein",
        "date_of_birth": (date.today() + timedelta(days=10)).isoformat(),
        "gender": "Female",
        "health_status": "Healthy",
        "weight_kg": 500.0,
        "location": "Barn A",
    }
    response = client.post("/api/v1/cows", json=payload, headers=admin_headers)
    assert response.status_code == 400
    assert "cannot be in the future" in response.json()["detail"]


def test_get_cow_detail(client, worker_headers):
    # Fetch list first
    list_res = client.get("/api/v1/cows", headers=worker_headers)
    cows = list_res.json()
    cow_id = cows[0]["id"]

    response = client.get(f"/api/v1/cows/{cow_id}", headers=worker_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == cow_id
    assert "recent_health_records" in data
    assert "recent_milk_logs" in data


def test_update_cow_manager(client, admin_headers, worker_headers):
    list_res = client.get("/api/v1/cows", headers=worker_headers)
    cows = list_res.json()
    cow_id = cows[0]["id"]

    update_payload = {
        "location": "Pasture North",
        "weight_kg": 675.0,
    }
    response = client.put(
        f"/api/v1/cows/{cow_id}", json=update_payload, headers=admin_headers
    )
    assert response.status_code == 200
    data = response.json()
    assert data["location"] == "Pasture North"
    assert data["weight_kg"] == 675.0


def test_update_cow_worker_forbidden(client, worker_headers):
    list_res = client.get("/api/v1/cows", headers=worker_headers)
    cows = list_res.json()
    cow_id = cows[0]["id"]

    update_payload = {"location": "Pasture East"}
    response = client.put(
        f"/api/v1/cows/{cow_id}", json=update_payload, headers=worker_headers
    )
    assert response.status_code == 403


def test_delete_cow_manager(client, admin_headers, worker_headers):
    # Create temporary cow to delete
    payload = {
        "tag_id": "COW-DELETE-ME",
        "breed": "Simmental",
        "date_of_birth": (date.today() - timedelta(days=200)).isoformat(),
        "gender": "Female",
        "health_status": "Healthy",
        "weight_kg": 550.0,
        "location": "Barn D",
    }
    create_res = client.post("/api/v1/cows", json=payload, headers=admin_headers)
    cow_id = create_res.json()["id"]

    # Delete as worker -> 403
    del_worker = client.delete(f"/api/v1/cows/{cow_id}", headers=worker_headers)
    assert del_worker.status_code == 403

    # Delete as manager -> 204
    del_admin = client.delete(f"/api/v1/cows/{cow_id}", headers=admin_headers)
    assert del_admin.status_code == 204

    # Verify deleted
    get_res = client.get(f"/api/v1/cows/{cow_id}", headers=admin_headers)
    assert get_res.status_code == 404
