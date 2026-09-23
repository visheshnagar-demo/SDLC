"""Test suite for Subject endpoints and business logic."""

from datetime import date, timedelta


def test_create_and_get_subject(client):
    payload = {
        "name": "Physics Mechanics",
        "difficulty_level": 4,
        "target_date": (date.today() + timedelta(days=30)).isoformat(),
        "estimated_total_hours": 25.0,
        "color_tag": "#EF4444",
    }
    # 1. Create subject
    response = client.post("/api/v1/subjects", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Physics Mechanics"
    assert data["difficulty_level"] == 4
    assert data["estimated_total_hours"] == 25.0
    assert data["color_tag"] == "#EF4444"
    subject_id = data["id"]
    assert subject_id is not None

    # 2. Get subject by ID
    get_res = client.get(f"/api/v1/subjects/{subject_id}")
    assert get_res.status_code == 200
    get_data = get_res.json()
    assert get_data["id"] == subject_id
    assert get_data["name"] == "Physics Mechanics"


def test_list_subjects(client):
    # Ensure at least one subject exists
    payload = {
        "name": "Linear Algebra",
        "difficulty_level": 3,
        "target_date": (date.today() + timedelta(days=40)).isoformat(),
        "estimated_total_hours": 15.0,
        "color_tag": "#3B82F6",
    }
    client.post("/api/v1/subjects", json=payload)

    response = client.get("/api/v1/subjects")
    assert response.status_code == 200
    subjects = response.json()
    assert isinstance(subjects, list)
    assert len(subjects) >= 1


def test_update_and_delete_subject(client):
    payload = {
        "name": "Cell Biology",
        "difficulty_level": 2,
        "target_date": (date.today() + timedelta(days=50)).isoformat(),
        "estimated_total_hours": 12.0,
        "color_tag": "#10B981",
    }
    create_res = client.post("/api/v1/subjects", json=payload)
    assert create_res.status_code == 201
    subject_id = create_res.json()["id"]

    # Update
    update_res = client.put(
        f"/api/v1/subjects/{subject_id}",
        json={"name": "Advanced Cell Biology", "difficulty_level": 4},
    )
    assert update_res.status_code == 200
    assert update_res.json()["name"] == "Advanced Cell Biology"
    assert update_res.json()["difficulty_level"] == 4

    # Delete
    del_res = client.delete(f"/api/v1/subjects/{subject_id}")
    assert del_res.status_code == 204

    # Verify 404
    get_res = client.get(f"/api/v1/subjects/{subject_id}")
    assert get_res.status_code == 404


def test_invalid_subject_validation(client):
    # Invalid difficulty (e.g. 6 when max is 5)
    invalid_payload = {
        "name": "Quantum Computing",
        "difficulty_level": 6,
        "target_date": (date.today() + timedelta(days=20)).isoformat(),
        "estimated_total_hours": 30.0,
    }
    res = client.post("/api/v1/subjects", json=invalid_payload)
    assert res.status_code == 422
