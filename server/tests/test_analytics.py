def test_get_dashboard_analytics(client):
    response = client.get("/api/v1/analytics/dashboard")
    assert response.status_code == 200
    data = response.json()

    assert "total_revenue" in data
    assert "total_orders" in data
    assert "total_flowers_in_stock" in data
    assert "low_stock_count" in data
    assert "top_selling_flowers" in data

    assert data["total_flowers_in_stock"] > 0
    # Purple Orchids seeded with stock 10, threshold 12 -> low stock count >= 1
    assert data["low_stock_count"] >= 1
