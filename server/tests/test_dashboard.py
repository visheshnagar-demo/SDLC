def test_get_dashboard_metrics(client, operator_headers):
    response = client.get("/api/v1/dashboard/metrics", headers=operator_headers)
    assert response.status_code == 200
    data = response.json()
    assert "active_channels" in data
    assert "concurrent_viewers" in data
    assert "transmission_health_pct" in data
    assert "active_emergency_alerts" in data
