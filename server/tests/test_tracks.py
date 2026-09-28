from fastapi.testclient import TestClient


def test_list_tracks(client: TestClient):
    response = client.get("/api/v1/tracks")
    assert response.status_code == 200
    tracks = response.json()
    assert isinstance(tracks, list)
    assert len(tracks) >= 3
    slugs = [t["slug"] for t in tracks]
    assert "math-for-ml" in slugs
    assert "supervised-learning" in slugs
    assert "deep-learning" in slugs
    # Check fields
    for t in tracks:
        assert "id" in t
        assert "title" in t
        assert "difficulty" in t
        assert "estimated_hours" in t
        assert "module_count" in t
        assert "prerequisites" in t
        assert t["module_count"] >= 1


def test_list_tracks_filter_difficulty(client: TestClient):
    response = client.get("/api/v1/tracks?difficulty=Beginner")
    assert response.status_code == 200
    tracks = response.json()
    assert len(tracks) >= 1
    for t in tracks:
        assert "beginner" in t["difficulty"].lower()


def test_get_track_by_slug(client: TestClient):
    response = client.get("/api/v1/tracks/supervised-learning")
    assert response.status_code == 200
    track = response.json()
    assert track["slug"] == "supervised-learning"
    assert track["title"] == "Supervised Learning Mastery"
    assert track["prerequisites"] is not None
    assert len(track["modules"]) >= 1
    first_mod = track["modules"][0]
    assert first_mod["slug"] == "gradient-descent-optimization"
    assert first_mod["tutorial_count"] >= 1
    assert first_mod["has_quiz"] is True
    assert first_mod["prerequisites"] is not None


def test_get_track_not_found(client: TestClient):
    response = client.get("/api/v1/tracks/non-existent-track")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


def test_get_module_by_slug(client: TestClient):
    response = client.get("/api/v1/modules/gradient-descent-optimization")
    assert response.status_code == 200
    module = response.json()
    assert module["slug"] == "gradient-descent-optimization"
    assert module["title"] == "Gradient Descent & Optimization"
    assert module["track_title"] == "Supervised Learning Mastery"
    assert module["prerequisites"] is not None
    assert len(module["tutorials"]) >= 1
    assert module["quiz_id"] is not None


def test_get_module_not_found(client: TestClient):
    response = client.get("/api/v1/modules/unknown-module-xyz")
    assert response.status_code == 404
