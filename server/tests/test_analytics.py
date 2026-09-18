def test_get_dashboard_analytics(client):
    response = client.get("/api/v1/analytics/dashboard")
    assert response.status_code == 200
    data = response.json()

    assert "total_flowers" in data
    assert "total_species" in data
    assert "total_stock" in data
    assert "low_stock_count" in data
    assert "total_orders" in data
    assert "total_revenue" in data
    assert "daily_revenue" in data
    assert "top_selling_flowers" in data
    assert "low_stock_items" in data
    assert "recent_orders" in data

    assert data["total_flowers"] >= 1
    assert data["total_stock"] >= 0
    assert isinstance(data["low_stock_items"], list)
    assert isinstance(data["recent_orders"], list)
