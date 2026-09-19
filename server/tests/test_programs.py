def test_list_programs(client, journalist_headers):
    response = client.get("/api/v1/programs", headers=journalist_headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1


def test_create_program(client, manager_headers):
    payload = {
        "title": "Late Night Tech Talk",
        "category": "Technology",
        "description": "Analysis of cutting edge technology and AI news.",
        "default_duration_minutes": 45,
        "host_name": "Elena Rostova",
        "is_recurring": True,
    }
    response = client.post("/api/v1/programs", json=payload, headers=manager_headers)
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Late Night Tech Talk"
    assert data["category"] == "Technology"


def test_update_program(client, manager_headers):
    programs = client.get("/api/v1/programs", headers=manager_headers).json()
    program_id = programs[0]["id"]

    response = client.put(
        f"/api/v1/programs/{program_id}",
        json={"host_name": "Updated Host Name"},
        headers=manager_headers,
    )
    assert response.status_code == 200
    assert response.json()["host_name"] == "Updated Host Name"


def test_delete_program(client, admin_headers):
    # Create temp program to delete
    payload = {
        "title": "Temp Show",
        "category": "Entertainment",
        "default_duration_minutes": 30,
    }
    created = client.post(
        "/api/v1/programs", json=payload, headers=admin_headers
    ).json()

    response = client.delete(f"/api/v1/programs/{created['id']}", headers=admin_headers)
    assert response.status_code == 204
