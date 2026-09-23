def test_export_pdf_success(client):
    itin_res = client.post(
        "/api/v1/itineraries/generate",
        json={
            "destination": "Kyoto, Japan",
            "budget": 1200.0,
            "duration_days": 3,
            "interests": ["Culture", "Temples"],
        },
    )
    itin_id = itin_res.json()["id"]

    res = client.get(f"/api/v1/itineraries/{itin_id}/export/pdf")
    assert res.status_code == 200
    assert "application/pdf" in res.headers["content-type"]
    assert len(res.content) > 0
    assert res.content.startswith(b"%PDF")


def test_export_ics_success(client):
    itin_res = client.post(
        "/api/v1/itineraries/generate",
        json={
            "destination": "Sydney, Australia",
            "budget": 2500.0,
            "duration_days": 4,
            "interests": ["Beaches", "Sightseeing"],
        },
    )
    itin_id = itin_res.json()["id"]

    res = client.get(f"/api/v1/itineraries/{itin_id}/export/ics")
    assert res.status_code == 200
    assert "text/calendar" in res.headers["content-type"]
    assert b"BEGIN:VCALENDAR" in res.content
    assert b"END:VCALENDAR" in res.content


def test_share_itinerary_endpoint(client):
    itin_res = client.post(
        "/api/v1/itineraries/generate",
        json={
            "destination": "Florence, Italy",
            "budget": 1600.0,
            "duration_days": 3,
            "interests": ["Art", "Food"],
        },
    )
    itin_id = itin_res.json()["id"]

    res = client.post(f"/api/v1/itineraries/{itin_id}/share")
    assert res.status_code == 200
    data = res.json()
    assert "share_token" in data
    assert "share_url" in data
    assert data["share_token"] in data["share_url"]
