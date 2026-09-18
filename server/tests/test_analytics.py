def test_get_dashboard_analytics(client, admin_headers):
    response = client.get("/api/v1/analytics/dashboard", headers=admin_headers)
    assert response.status_code == 200
    data = response.json()
    assert "total_devices" in data
    assert "active_assignments" in data
    assert "available_devices" in data
    assert "non_compliant_count" in data
    assert "os_distribution" in data
    assert "status_distribution" in data
    assert data["total_devices"] >= 1
