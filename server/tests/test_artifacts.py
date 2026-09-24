def test_list_and_search_artifacts(client):
    # Test list
    response = client.get("/api/v1/artifacts")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 3

    # Test search by title
    search_resp = client.get("/api/v1/artifacts?q=Amphora")
    assert search_resp.status_code == 200
    search_data = search_resp.json()
    assert len(search_data) >= 1
    assert search_data[0]["accession_no"] == "ART-2026-001"

    # Test category filter
    cat_resp = client.get("/api/v1/artifacts?category=Ceramic")
    assert cat_resp.status_code == 200
    assert all(a["category"] == "Ceramic" for a in cat_resp.json())


def test_create_artifact_success(client):
    locations_resp = client.get("/api/v1/locations")
    loc_id = locations_resp.json()[0]["id"]

    payload = {
        "accession_no": "ART-2026-999",
        "title": "Hellenistic Marble Torso",
        "description": "Classical sculpture fragment showing classical anatomy.",
        "category": "Sculpture",
        "medium": "Parian Marble",
        "creation_era": "2nd Century BCE",
        "origin": "Delos, Greece",
        "accession_date": "2026-04-12",
        "current_location_id": loc_id,
        "status": "On Display",
        "condition_rating": "Pristine",
        "image_url": "https://images.museum.org/artifacts/art-2026-999.jpg"
    }
    create_resp = client.post("/api/v1/artifacts", json=payload)
    assert create_resp.status_code == 201
    created = create_resp.json()
    assert created["accession_no"] == "ART-2026-999"
    assert created["title"] == payload["title"]


def test_create_artifact_duplicate_accession_409(client):
    locations_resp = client.get("/api/v1/locations")
    loc_id = locations_resp.json()[0]["id"]

    payload = {
        "accession_no": "ART-2026-001",  # Already seeded
        "title": "Duplicate Amphora",
        "category": "Ceramic",
        "current_location_id": loc_id,
        "accession_date": "2026-01-01"
    }
    resp = client.post("/api/v1/artifacts", json=payload)
    assert resp.status_code == 409
    assert "already exists" in resp.json()["detail"]


def test_get_artifact_detail(client):
    response = client.get("/api/v1/artifacts/3fa85f64-5717-4562-b3fc-2c963f66afa6")
    assert response.status_code == 200
    data = response.json()
    assert data["accession_no"] == "ART-2026-001"
    assert "location" in data
    assert "restorations" in data


def test_update_artifact(client):
    update_payload = {
        "title": "Roman Terracotta Amphora (Restored)",
        "condition_rating": "Pristine"
    }
    resp = client.put("/api/v1/artifacts/3fa85f64-5717-4562-b3fc-2c963f66afa6", json=update_payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["title"] == "Roman Terracotta Amphora (Restored)"
    assert data["condition_rating"] == "Pristine"


def test_delete_artifact_with_restoration_blocked_409(client):
    # ART-2026-001 has a restoration record attached
    resp = client.delete("/api/v1/artifacts/3fa85f64-5717-4562-b3fc-2c963f66afa6")
    assert resp.status_code == 409
    assert "conservation treatment history" in resp.json()["detail"]


def test_delete_artifact_with_active_loan_blocked_409(client):
    # ART-2026-085 has an active/in-transit loan attached
    resp = client.delete("/api/v1/artifacts/d4e5f6a7-b8c9-0123-4567-89abcdef0123")
    assert resp.status_code == 409
    assert "active or in-transit loan" in resp.json()["detail"]
