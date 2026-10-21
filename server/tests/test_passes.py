"""Tests for digital pass lookup and attendee wallet endpoints."""
import pytest


def test_get_pass_by_id(client, user_token):
    """Test retrieving digital pass by ID."""
    headers = {"Authorization": f"Bearer {user_token}"}
    events_resp = client.get("/api/v1/events")
    event_id = events_resp.json()[0]["id"]
    tier_id = client.get(f"/api/v1/events/{event_id}/tiers").json()[0]["id"]

    booking_resp = client.post(
        "/api/v1/bookings",
        json={
            "eventId": event_id,
            "passTierId": tier_id,
            "quantity": 1,
            "attendees": [{"fullName": "Kiran Dave", "email": "kiran@example.com"}],
        },
        headers=headers,
    )
    pass_id = booking_resp.json()["passes"][0]["id"]

    response = client.get(f"/api/v1/passes/{pass_id}")
    assert response.status_code == 200
    pass_data = response.json()
    assert pass_data["id"] == pass_id
    assert pass_data["attendee_name"] == "Kiran Dave"
    assert pass_data["qr_payload"].startswith("GMSv1.")


def test_get_my_passes(client, user_token):
    """Test retrieving passes owned by current user."""
    headers = {"Authorization": f"Bearer {user_token}"}
    response = client.get("/api/v1/passes/my-passes", headers=headers)
    assert response.status_code == 200
    passes = response.json()
    assert isinstance(passes, list)


def test_get_pass_not_found(client):
    """Test getting non-existent pass returns 404."""
    response = client.get("/api/v1/passes/invalid-pass-id-12345")
    assert response.status_code == 404
