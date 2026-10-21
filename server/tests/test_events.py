"""Tests for event discovery and pass tier endpoints."""
import pytest


def test_list_events(client):
    """Test listing all active Garba events."""
    response = client.get("/api/v1/events")
    assert response.status_code == 200
    events = response.json()
    assert isinstance(events, list)
    assert len(events) >= 1
    assert any("GarbaFest" in e["title"] for e in events)


def test_get_event_by_id(client):
    """Test getting single event details."""
    events_resp = client.get("/api/v1/events")
    event_id = events_resp.json()[0]["id"]

    response = client.get(f"/api/v1/events/{event_id}")
    assert response.status_code == 200
    event = response.json()
    assert event["id"] == event_id
    assert "venue_name" in event


def test_get_event_not_found(client):
    """Test getting non-existent event returns 404."""
    response = client.get("/api/v1/events/non-existent-id")
    assert response.status_code == 404


def test_get_event_pass_tiers(client):
    """Test getting pass tiers for an event."""
    events_resp = client.get("/api/v1/events")
    event_id = events_resp.json()[0]["id"]

    response = client.get(f"/api/v1/events/{event_id}/tiers")
    assert response.status_code == 200
    tiers = response.json()
    assert isinstance(tiers, list)
    assert len(tiers) >= 3  # Single-Day, Season, VIP
    tier_names = [t["tier_name"] for t in tiers]
    assert "Single-Day Pass" in tier_names
    assert "Season Pass" in tier_names
    assert "VIP Pass" in tier_names


def test_create_event_and_tier(client, admin_token):
    """Test creating new event and adding pass tier."""
    headers = {"Authorization": f"Bearer {admin_token}"}
    event_payload = {
        "title": "Dandiya Night Live 2026",
        "description": "Exclusive live concert and Garba night",
        "venue_name": "Royal Palace Grounds",
        "start_date": "2026-10-20",
        "end_date": "2026-10-20",
        "status": "ACTIVE",
    }
    event_resp = client.post("/api/v1/events", json=event_payload, headers=headers)
    assert event_resp.status_code == 201
    created_event = event_resp.json()
    event_id = created_event["id"]

    tier_payload = {
        "tier_name": "Early Bird Pass",
        "description": "Discounted admission for first 100 entries",
        "price": 20.0,
        "total_quota": 100,
        "available_quota": 100,
        "valid_from": "2026-10-20",
        "valid_to": "2026-10-20",
    }
    tier_resp = client.post(f"/api/v1/events/{event_id}/tiers", json=tier_payload, headers=headers)
    assert tier_resp.status_code == 201
    tier = tier_resp.json()
    assert tier["tier_name"] == "Early Bird Pass"
    assert tier["price"] == 20.0
