def test_get_dashboard_analytics(client):
    response = client.get("/api/v1/analytics/dashboard")
    assert response.status_code == 200
    data = response.json()
    assert "total_devices" in data
    assert "active_assignments" in data
    assert "available_devices" in data
    assert "non_compliant_count" in data
    assert "os_distribution" in data
