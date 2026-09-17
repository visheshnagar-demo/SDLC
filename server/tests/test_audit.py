def test_get_audit_logs(client):
    response = client.get("/api/v1/audit/logs?skip=0&limit=20")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)


def test_get_analytics_dashboard(client):
    response = client.get("/api/v1/analytics/dashboard")
    assert response.status_code == 200
    data = response.json()
    assert "total_circulation" in data
    assert "active_accounts" in data
    assert "low_stock_count" in data
    assert "volume_24h" in data
    assert "recent_transactions" in data
