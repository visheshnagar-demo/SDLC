from datetime import date

def test_dashboard_analytics_kpis(client):
    # Setup active flock with 500 hens
    flock_res = client.post(
        "/api/v1/flocks",
        json={
            "name": "Analytics Flock",
            "breed": "Rhode Island Red",
            "hatch_date": "2025-01-10",
            "initial_count": 500,
            "coop_location": "Coop #1",
        },
    )
    flock_id = flock_res.json()["id"]

    # Log 450 eggs today
    today_str = date.today().isoformat()
    client.post(
        "/api/v1/egg-collections",
        json={
            "flock_id": flock_id,
            "collection_date": today_str,
            "session": "Morning",
            "grade_large": 400,
            "grade_medium": 40,
            "grade_small": 0,
            "damaged": 10,
        },
    )

    # Setup low stock feed (40 kg < 100 kg reorder)
    client.post(
        "/api/v1/feed-inventory",
        json={
            "feed_type": "Low Stock Feed Test",
            "quantity_kg": 40.0,
            "reorder_threshold_kg": 100.0,
        },
    )

    # Fetch dashboard analytics
    res = client.get("/api/v1/analytics/dashboard")
    assert res.status_code == 200
    data = res.json()

    assert data["total_active_flocks"] >= 1
    assert data["total_active_hens"] >= 500
    assert data["today_egg_total"] >= 450
    assert data["overall_laying_rate_pct"] > 0.0
    assert any(
        item["feed_type"] == "Low Stock Feed Test"
        for item in data["low_stock_alerts"]
    )


def test_dashboard_zero_hens_safe_division(client):
    # Fetch dashboard when active hens is 0 or all archived
    res = client.get("/api/v1/analytics/dashboard")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data["overall_laying_rate_pct"], float)
