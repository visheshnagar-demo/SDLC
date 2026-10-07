def test_analytics_summary(client, worker_headers):
    response = client.get("/api/v1/analytics/summary", headers=worker_headers)
    assert response.status_code == 200
    data = response.json()
    assert "total_cows" in data
    assert "lactating_cows" in data
    assert "today_total_yield_liters" in data
    assert "active_health_alerts" in data
    assert "status_breakdown" in data
    assert data["total_cows"] >= 4
    assert isinstance(data["status_breakdown"], dict)


def test_analytics_yield_trends(client, worker_headers):
    response = client.get(
        "/api/v1/analytics/yield-trends?days=7", headers=worker_headers
    )
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 7
    point = data[-1]
    assert "date" in point
    assert "total_yield" in point
    assert "average_per_cow" in point


def test_health_check(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"
