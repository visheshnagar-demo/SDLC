def test_get_dashboard_analytics(client):
    res = client.get("/api/v1/analytics/dashboard")
    assert res.status_code == 200
    data = res.json()
    assert "total_circulation" in data
    assert "active_accounts" in data
    assert "low_stock_count" in data
    assert "volume_24h" in data
    assert "recent_transactions" in data
