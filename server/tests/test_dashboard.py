"""Tests for parental weekly dashboard and nutrition analytics."""


def test_get_weekly_dashboard(client):
    profiles = client.get("/api/v1/profiles").json()
    leo_id = profiles[0]["id"]

    response = client.get(f"/api/v1/dashboard/weekly?child_id={leo_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["child_id"] == leo_id
    assert "completion_rate_percentage" in data
    assert "category_progress" in data
    progress = data["category_progress"]
    assert "fruits_percentage" in progress
    assert "vegetables_percentage" in progress
    assert "grains_percentage" in progress
    assert "proteins_percentage" in progress
    assert "water_percentage" in progress
    assert len(data["recommendations"]) >= 1
