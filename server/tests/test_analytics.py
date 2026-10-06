def test_get_dashboard_analytics(client):
    response = client.get("/api/v1/analytics/dashboard")
    assert response.status_code == 200
    data = response.json()

    # Validate core counts
    assert data["total_cows"] >= 3
    assert data["active_cows_count"] >= 3
    assert "active_lactating_count" in data
    assert "dry_count" in data
    assert "pregnant_count" in data
    assert "fertility_rate" in data
    assert "feed_conversion_efficiency" in data
    assert "rolling_7d_yield" in data
    assert "average_yield_per_cow" in data
    assert "active_withholding_count" in data
    assert "culling_rate" in data
    assert "data_incomplete_warning" in data

    # Validate lactation curve
    assert isinstance(data["lactation_curve"], list)
    assert len(data["lactation_curve"]) == 7

    # Validate alerts list structure
    assert isinstance(data["alerts"], list)
    for alert in data["alerts"]:
        assert "id" in alert
        assert "type" in alert
        assert "severity" in alert
        assert "title" in alert
        assert "message" in alert
