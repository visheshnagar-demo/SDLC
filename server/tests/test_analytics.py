def test_get_dashboard_analytics(client):
    response = client.get("/api/v1/analytics/dashboard")
    assert response.status_code == 200
    data = response.json()

    assert "total_species" in data
    assert "total_stock" in data
    assert "low_stock_count" in data
    assert "daily_revenue" in data
    assert "top_selling_flowers" in data
    assert "category_breakdown" in data
    assert "low_stock_alerts" in data

    assert isinstance(data["total_species"], int)
    assert data["total_species"] >= 1
    assert isinstance(data["total_stock"], int)
    assert isinstance(data["daily_revenue"], float)
    assert isinstance(data["top_selling_flowers"], list)
    assert isinstance(data["category_breakdown"], list)
