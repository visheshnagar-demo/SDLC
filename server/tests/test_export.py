def test_export_pdf_success(client):
    create_res = client.post(
        "/api/v1/itineraries/generate",
        json={
            "destination": "Seoul, South Korea",
            "budget": 1800.0,
            "currency": "USD",
            "duration_days": 3,
            "interests": ["Culture", "Food"],
        },
    )
    itin_id = create_res.json()["id"]

    res = client.get(f"/api/v1/itineraries/{itin_id}/export/pdf")
    assert res.status_code == 200
    assert res.headers["content-type"] == "application/pdf"
    assert len(res.content) > 100
    assert res.content.startswith(b"%PDF")


def test_export_ics_success(client):
    create_res = client.post(
        "/api/v1/itineraries/generate",
        json={
            "destination": "Sydney, Australia",
            "budget": 2500.0,
            "currency": "AUD",
            "duration_days": 2,
            "interests": ["Adventure", "Relaxation"],
        },
    )
    itin_id = create_res.json()["id"]

    res = client.get(f"/api/v1/itineraries/{itin_id}/export/ics")
    assert res.status_code == 200
    assert "text/calendar" in res.headers["content-type"]
    assert b"BEGIN:VCALENDAR" in res.content
    assert b"BEGIN:VEVENT" in res.content


def test_share_itinerary_endpoint(client):
    create_res = client.post(
        "/api/v1/itineraries/generate",
        json={
            "destination": "Cape Town, South Africa",
            "budget": 2000.0,
            "currency": "USD",
            "duration_days": 4,
            "interests": ["Adventure"],
        },
    )
    itin_id = create_res.json()["id"]

    share_res = client.post(f"/api/v1/itineraries/{itin_id}/share")
    assert share_res.status_code == 200
    data = share_res.json()
    assert "share_token" in data
    assert "share_url" in data
    assert len(data["share_token"]) > 0
