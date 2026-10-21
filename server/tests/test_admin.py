"""Tests for admin controls, live analytics metrics, pass tier quota updates, and CSV exports."""
import pytest


def test_get_live_analytics(client):
    """Test retrieving real-time event analytics."""
    response = client.get("/api/v1/admin/analytics/live")
    assert response.status_code == 200
    data = response.json()
    assert "totalPassesIssued" in data
    assert "totalCheckedIn" in data
    assert "grossRevenue" in data
    assert "gateMetrics" in data
    assert isinstance(data["gateMetrics"], list)


def test_admin_update_pass_tier_success(client, admin_token):
    """Test administrator updating pass tier pricing and quotas."""
    headers = {"Authorization": f"Bearer {admin_token}"}
    events_resp = client.get("/api/v1/events")
    event_id = events_resp.json()[0]["id"]
    tier = client.get(f"/api/v1/events/{event_id}/tiers").json()[0]
    tier_id = tier["id"]

    update_payload = {
        "price": 35.0,
        "total_quota": 1500,
        "available_quota": 1400,
    }

    response = client.put(
        f"/api/v1/admin/pass-tiers/{tier_id}",
        json=update_payload,
        headers=headers,
    )
    assert response.status_code == 200
    updated = response.json()
    assert updated["price"] == 35.0
    assert updated["total_quota"] == 1500
    assert updated["available_quota"] == 1400


def test_admin_update_pass_tier_forbidden_for_attendee(client, user_token):
    """Test non-admin user receives 403 Forbidden when attempting to adjust quotas."""
    headers = {"Authorization": f"Bearer {user_token}"}
    events_resp = client.get("/api/v1/events")
    event_id = events_resp.json()[0]["id"]
    tier_id = client.get(f"/api/v1/events/{event_id}/tiers").json()[0]["id"]

    update_payload = {"price": 10.0}
    response = client.put(
        f"/api/v1/admin/pass-tiers/{tier_id}",
        json=update_payload,
        headers=headers,
    )
    assert response.status_code == 403
    assert "Administrator privileges required" in response.json()["detail"]


def test_export_attendees_csv(client):
    """Test exporting attendee check-in roster as CSV."""
    response = client.get("/api/v1/admin/attendees/export")
    assert response.status_code == 200
    assert "text/csv" in response.headers.get("content-type", "")
    assert "garba_attendees_export.csv" in response.headers.get("content-disposition", "")
    csv_text = response.text
    assert "Pass ID,Pass Number,Booking Reference,Attendee Name" in csv_text
