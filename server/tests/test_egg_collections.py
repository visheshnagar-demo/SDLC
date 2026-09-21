def test_log_egg_collection_success(client):
    # Create flock
    flock_res = client.post(
        "/api/v1/flocks",
        json={
            "name": "Egg Flock 1",
            "breed": "Rhode Island Red",
            "hatch_date": "2025-01-10",
            "initial_count": 500,
            "coop_location": "Coop #1",
        },
    )
    flock_id = flock_res.json()["id"]

    # Log collection
    payload = {
        "flock_id": flock_id,
        "collection_date": "2026-05-18",
        "session": "Morning",
        "grade_large": 400,
        "grade_medium": 40,
        "grade_small": 0,
        "damaged": 10,
    }
    res = client.post("/api/v1/egg-collections", json=payload)
    assert res.status_code == 201
    data = res.json()
    assert data["total_count"] == 450
    assert data["warning"] is None


def test_log_egg_collection_exceeds_active_count_soft_warning(client):
    flock_res = client.post(
        "/api/v1/flocks",
        json={
            "name": "Small Flock",
            "breed": "Leghorn",
            "hatch_date": "2025-01-10",
            "initial_count": 100,
            "coop_location": "Coop #2",
        },
    )
    flock_id = flock_res.json()["id"]

    # Log 150 eggs for 100 active hens -> soft warning
    payload = {
        "flock_id": flock_id,
        "collection_date": "2026-05-18",
        "session": "Afternoon",
        "grade_large": 150,
        "grade_medium": 0,
        "grade_small": 0,
        "damaged": 0,
    }
    res = client.post("/api/v1/egg-collections", json=payload)
    assert res.status_code == 201
    data = res.json()
    assert data["total_count"] == 150
    assert data["warning"] is not None
    assert "exceeds active hen count" in data["warning"]


def test_log_egg_collection_invalid_flock(client):
    payload = {
        "flock_id": "non-existent-flock-id",
        "collection_date": "2026-05-18",
        "session": "Morning",
        "grade_large": 50,
        "grade_medium": 0,
        "grade_small": 0,
        "damaged": 0,
    }
    res = client.post("/api/v1/egg-collections", json=payload)
    assert res.status_code == 404


def test_list_egg_collections(client):
    flock_res = client.post(
        "/api/v1/flocks",
        json={
            "name": "Egg Flock 2",
            "breed": "Orpington",
            "hatch_date": "2025-01-10",
            "initial_count": 200,
            "coop_location": "Coop #3",
        },
    )
    flock_id = flock_res.json()["id"]

    client.post(
        "/api/v1/egg-collections",
        json={
            "flock_id": flock_id,
            "collection_date": "2026-05-18",
            "session": "Morning",
            "grade_large": 100,
            "grade_medium": 20,
            "grade_small": 0,
            "damaged": 5,
        },
    )

    list_res = client.get(f"/api/v1/egg-collections?flock_id={flock_id}")
    assert list_res.status_code == 200
    assert len(list_res.json()) >= 1
