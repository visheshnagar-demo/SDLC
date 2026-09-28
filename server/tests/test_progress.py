from fastapi.testclient import TestClient


def test_get_progress_authenticated(client: TestClient, auth_headers: dict[str, str]):
    response = client.get("/api/v1/progress", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert "overall_completion_percentage" in data
    assert "total_modules" in data
    assert "completed_modules" in data
    assert "track_progress" in data
    assert isinstance(data["track_progress"], list)
    assert len(data["track_progress"]) >= 3


def test_touch_module_progress(client: TestClient, auth_headers: dict[str, str]):
    response = client.post(
        "/api/v1/progress/gradient-descent-optimization/touch",
        json={"is_completed": True},
        headers=auth_headers,
    )
    assert response.status_code == 200
    res_data = response.json()
    assert res_data["status"] == "success"
    assert res_data["is_completed"] is True

    # Check that progress reflects this completed module
    prog_res = client.get("/api/v1/progress", headers=auth_headers)
    assert prog_res.status_code == 200
    prog_data = prog_res.json()
    assert prog_data["completed_modules"] >= 1
    assert prog_data["recent_module"] is not None
    assert prog_data["recent_module"]["slug"] == "gradient-descent-optimization"


def test_touch_nonexistent_module(client: TestClient, auth_headers: dict[str, str]):
    response = client.post(
        "/api/v1/progress/nonexistent-module-xyz/touch",
        json={"is_completed": True},
        headers=auth_headers,
    )
    assert response.status_code == 404
