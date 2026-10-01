"""Tests for rewards, badges, and streaks."""


def test_get_badges(client):
    profiles = client.get("/api/v1/profiles").json()
    leo_id = profiles[0]["id"]

    response = client.get(f"/api/v1/rewards/badges?child_id={leo_id}")
    assert response.status_code == 200
    badges = response.json()
    assert isinstance(badges, list)
    assert len(badges) >= 3

    # Check Veggie Hero badge exists
    veggie_badge = next((b for b in badges if b["code"] == "VEGGIE_HERO_5"), None)
    assert veggie_badge is not None
    assert veggie_badge["title"] == "Veggie Hero"
    assert veggie_badge["point_reward"] == 100


def test_get_streak(client):
    profiles = client.get("/api/v1/profiles").json()
    leo_id = profiles[0]["id"]

    response = client.get(f"/api/v1/rewards/streak?child_id={leo_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["child_id"] == leo_id
    assert "active_streak_days" in data
    assert "total_points" in data
    assert "progress_indicators" in data
