def test_generate_itinerary_success(client):
    payload = {
        "destination": "Tokyo, Japan",
        "budget": 2000.0,
        "currency": "USD",
        "duration_days": 7,
        "interests": ["Food", "Culture", "Anime"],
    }
    response = client.post("/api/v1/itineraries/generate", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["destination"] == "Tokyo, Japan"
    assert data["budget"] == 2000.0
    assert data["duration_days"] == 7
    assert len(data["days"]) == 7
    assert data["total_estimated_cost"] > 0
    assert data["budget_status"] in ["WITHIN_BUDGET", "OVER_BUDGET"]
    assert "share_token" in data
    assert len(data["days"][0]["activities"]) > 0


def test_generate_itinerary_invalid_duration(client):
    # Duration < 1
    res1 = client.post(
        "/api/v1/itineraries/generate",
        json={
            "destination": "Paris, France",
            "budget": 1500.0,
            "duration_days": 0,
            "interests": ["Art"],
        },
    )
    assert res1.status_code == 422

    # Duration > 30
    res2 = client.post(
        "/api/v1/itineraries/generate",
        json={
            "destination": "Paris, France",
            "budget": 1500.0,
            "duration_days": 35,
            "interests": ["Art"],
        },
    )
    assert res2.status_code == 422


def test_generate_itinerary_invalid_budget(client):
    # Negative budget
    res = client.post(
        "/api/v1/itineraries/generate",
        json={
            "destination": "Rome, Italy",
            "budget": -50.0,
            "duration_days": 5,
            "interests": ["History"],
        },
    )
    assert res.status_code == 422


def test_get_itinerary_by_id(client):
    create_res = client.post(
        "/api/v1/itineraries/generate",
        json={
            "destination": "Kyoto, Japan",
            "budget": 1200.0,
            "duration_days": 3,
            "interests": ["Culture"],
        },
    )
    assert create_res.status_code == 201
    itin_id = create_res.json()["id"]

    get_res = client.get(f"/api/v1/itineraries/{itin_id}")
    assert get_res.status_code == 200
    assert get_res.json()["id"] == itin_id
    assert get_res.json()["destination"] == "Kyoto, Japan"


def test_get_itinerary_not_found(client):
    res = client.get("/api/v1/itineraries/non-existent-uuid-12345")
    assert res.status_code == 404


def test_list_itineraries(client):
    res = client.get("/api/v1/itineraries?skip=0&limit=10")
    assert res.status_code == 200
    assert isinstance(res.json(), list)


def test_update_itinerary_metadata(client):
    create_res = client.post(
        "/api/v1/itineraries/generate",
        json={
            "destination": "London, UK",
            "budget": 1800.0,
            "duration_days": 4,
            "interests": ["Sightseeing"],
        },
    )
    itin_id = create_res.json()["id"]

    update_payload = {
        "destination": "Greater London, UK",
        "budget": 2200.0,
        "duration_days": 5,
        "interests": ["Sightseeing", "Museums"],
    }
    update_res = client.put(f"/api/v1/itineraries/{itin_id}", json=update_payload)
    assert update_res.status_code == 200
    data = update_res.json()
    assert data["destination"] == "Greater London, UK"
    assert data["budget"] == 2200.0
    assert data["duration_days"] == 5
    assert len(data["days"]) == 5


def test_get_shared_itinerary(client):
    create_res = client.post(
        "/api/v1/itineraries/generate",
        json={
            "destination": "Barcelona, Spain",
            "budget": 1500.0,
            "duration_days": 3,
            "interests": ["Food", "Architecture"],
        },
    )
    share_token = create_res.json()["share_token"]

    shared_res = client.get(f"/api/v1/itineraries/shared/{share_token}")
    assert shared_res.status_code == 200
    assert shared_res.json()["destination"] == "Barcelona, Spain"
