def test_generate_itinerary_success(client):
    payload = {
        "destination": "Tokyo, Japan",
        "budget": 2000.0,
        "currency": "USD",
        "duration_days": 5,
        "interests": ["Culture", "Food", "Anime"],
    }
    response = client.post("/api/v1/itineraries/generate", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["destination"] == "Tokyo, Japan"
    assert data["budget"] == 2000.0
    assert data["currency"] == "USD"
    assert data["duration_days"] == 5
    assert len(data["days"]) == 5
    assert data["budget_status"] in ["WITHIN_BUDGET", "OVER_BUDGET"]
    assert "id" in data


def test_get_itinerary_by_id(client):
    # Create an itinerary first
    create_res = client.post(
        "/api/v1/itineraries/generate",
        json={
            "destination": "Paris, France",
            "budget": 1500.0,
            "currency": "EUR",
            "duration_days": 3,
            "interests": ["Culture", "Food"],
        },
    )
    assert create_res.status_code == 201
    itin_id = create_res.json()["id"]

    # Retrieve by ID
    get_res = client.get(f"/api/v1/itineraries/{itin_id}")
    assert get_res.status_code == 200
    data = get_res.json()
    assert data["id"] == itin_id
    assert data["destination"] == "Paris, France"
    assert len(data["days"]) == 3


def test_get_itinerary_not_found(client):
    res = client.get("/api/v1/itineraries/non-existent-id")
    assert res.status_code == 404
    assert "not found" in res.json()["detail"].lower()


def test_list_itineraries(client):
    client.post(
        "/api/v1/itineraries/generate",
        json={
            "destination": "Rome, Italy",
            "budget": 1200.0,
            "currency": "EUR",
            "duration_days": 2,
            "interests": ["Culture"],
        },
    )
    client.post(
        "/api/v1/itineraries/generate",
        json={
            "destination": "Kyoto, Japan",
            "budget": 1800.0,
            "currency": "USD",
            "duration_days": 4,
            "interests": ["Relaxation"],
        },
    )

    res = client.get("/api/v1/itineraries?skip=0&limit=10")
    assert res.status_code == 200
    data = res.json()
    assert len(data) >= 2


def test_update_itinerary_metadata(client):
    create_res = client.post(
        "/api/v1/itineraries/generate",
        json={
            "destination": "London, UK",
            "budget": 1000.0,
            "currency": "GBP",
            "duration_days": 2,
            "interests": ["History"],
        },
    )
    itin_id = create_res.json()["id"]

    update_res = client.put(
        f"/api/v1/itineraries/{itin_id}",
        json={"destination": "London & Oxford, UK", "budget": 1400.0},
    )
    assert update_res.status_code == 200
    data = update_res.json()
    assert data["destination"] == "London & Oxford, UK"
    assert data["budget"] == 1400.0


def test_get_shared_itinerary(client):
    create_res = client.post(
        "/api/v1/itineraries/generate",
        json={
            "destination": "New York, USA",
            "budget": 3000.0,
            "currency": "USD",
            "duration_days": 3,
            "interests": ["Food", "Nightlife"],
        },
    )
    itin_id = create_res.json()["id"]

    # Share itinerary
    share_res = client.post(f"/api/v1/itineraries/{itin_id}/share")
    assert share_res.status_code == 200
    share_token = share_res.json()["share_token"]

    # Fetch via share token
    shared_res = client.get(f"/api/v1/itineraries/shared/{share_token}")
    assert shared_res.status_code == 200
    assert shared_res.json()["id"] == itin_id
    assert shared_res.json()["destination"] == "New York, USA"
