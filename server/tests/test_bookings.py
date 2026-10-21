"""Tests for Garba pass booking and digital pass minting."""
import pytest


def test_create_booking_success(client, user_token):
    """Test creating a booking generates confirmed order and HMAC signed digital passes."""
    headers = {"Authorization": f"Bearer {user_token}"}
    events_resp = client.get("/api/v1/events")
    event_id = events_resp.json()[0]["id"]

    tiers_resp = client.get(f"/api/v1/events/{event_id}/tiers")
    tier = tiers_resp.json()[0]
    tier_id = tier["id"]
    initial_quota = tier["available_quota"]

    booking_payload = {
        "eventId": event_id,
        "passTierId": tier_id,
        "quantity": 2,
        "attendees": [
            {"fullName": "Aarav Patel", "email": "aarav@example.com", "phone": "+14155550199"},
            {"fullName": "Diya Patel", "email": "diya@example.com", "phone": "+14155550198"},
        ],
    }

    response = client.post("/api/v1/bookings", json=booking_payload, headers=headers)
    assert response.status_code == 201
    booking = response.json()
    assert booking["booking_status"] == "CONFIRMED"
    assert booking["total_amount"] == tier["price"] * 2
    assert len(booking["passes"]) == 2

    pass_1 = booking["passes"][0]
    assert pass_1["attendee_name"] == "Aarav Patel"
    assert pass_1["status"] == "ACTIVE"
    assert pass_1["qr_signature_hash"] != ""
    assert pass_1["qr_payload"].startswith("GMSv1.")

    # Verify quota decremented
    updated_tiers = client.get(f"/api/v1/events/{event_id}/tiers").json()
    updated_tier = next(t for t in updated_tiers if t["id"] == tier_id)
    assert updated_tier["available_quota"] == initial_quota - 2


def test_booking_exceeds_available_quota(client, admin_token):
    """Test booking more than available quota returns 400 Bad Request."""
    headers = {"Authorization": f"Bearer {admin_token}"}
    # Create small tier with quota 1
    events_resp = client.get("/api/v1/events")
    event_id = events_resp.json()[0]["id"]

    tier_resp = client.post(
        f"/api/v1/events/{event_id}/tiers",
        json={
            "tier_name": "Limited VIP",
            "price": 500.0,
            "total_quota": 1,
            "available_quota": 1,
            "valid_from": "2026-10-15",
            "valid_to": "2026-10-24",
        },
        headers=headers,
    )
    small_tier_id = tier_resp.json()["id"]

    booking_payload = {
        "eventId": event_id,
        "passTierId": small_tier_id,
        "quantity": 5,
        "attendees": [{"fullName": "Test Attendee"}],
    }
    response = client.post("/api/v1/bookings", json=booking_payload, headers=headers)
    assert response.status_code == 400
    assert "sold out or insufficient" in response.json()["detail"]


def test_get_booking_by_id(client, user_token):
    """Test retrieving booking details by ID."""
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
            "attendees": [{"fullName": "Rahul Shah"}],
        },
        headers=headers,
    )
    booking_id = booking_resp.json()["id"]

    response = client.get(f"/api/v1/bookings/{booking_id}")
    assert response.status_code == 200
    assert response.json()["id"] == booking_id
