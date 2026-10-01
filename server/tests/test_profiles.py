"""Tests for child profile management."""


def test_list_profiles(client):
    response = client.get("/api/v1/profiles")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    assert any(c["display_name"] == "Leo" for c in data)


def test_create_and_get_profile(client):
    create_resp = client.post(
        "/api/v1/profiles",
        json={"display_name": "Maya", "age": 5},
    )
    assert create_resp.status_code == 201
    child = create_resp.json()
    assert child["display_name"] == "Maya"
    assert child["age"] == 5
    assert child["total_points"] == 0

    child_id = child["id"]
    get_resp = client.get(f"/api/v1/profiles/{child_id}")
    assert get_resp.status_code == 200
    assert get_resp.json()["display_name"] == "Maya"


def test_update_profile(client):
    create_resp = client.post(
        "/api/v1/profiles",
        json={"display_name": "Sammy", "age": 8},
    )
    assert create_resp.status_code == 201
    child_id = create_resp.json()["id"]

    update_resp = client.put(
        f"/api/v1/profiles/{child_id}",
        json={"display_name": "Sammy Junior", "age": 9},
    )
    assert update_resp.status_code == 200
    updated = update_resp.json()
    assert updated["display_name"] == "Sammy Junior"
    assert updated["age"] == 9
