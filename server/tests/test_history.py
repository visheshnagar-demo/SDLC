from datetime import datetime, timedelta, timezone


def test_visitor_history_filtering(
    client, host_user, receptionist_headers, host_headers
):
    # Register multiple visits
    now = datetime.now(timezone.utc)
    client.post(
        "/api/v1/visitors/register",
        json={
            "full_name": "Historical Guest 1",
            "email": "guest1@history.org",
            "phone": "555-0011",
            "company": "Historic Corp",
            "purpose": "Archive Review",
            "scheduled_start_time": (now + timedelta(hours=1)).isoformat(),
            "host_id": host_user.id,
        },
    )

    client.post(
        "/api/v1/visitors/register",
        json={
            "full_name": "Historical Guest 2",
            "email": "guest2@history.org",
            "phone": "555-0022",
            "company": "Historic Corp",
            "purpose": "Artifact Delivery",
            "scheduled_start_time": (now + timedelta(hours=2)).isoformat(),
            "host_id": host_user.id,
        },
    )

    # 1. Receptionist queries history
    resp = client.get(
        "/api/v1/history?visitor_name=Historical Guest", headers=receptionist_headers
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] >= 2
    assert len(data["items"]) >= 2

    # 2. Filter by status
    resp_pending = client.get(
        "/api/v1/history?status=PENDING_APPROVAL", headers=receptionist_headers
    )
    assert resp_pending.status_code == 200
    for item in resp_pending.json()["items"]:
        assert item["status"] == "PENDING_APPROVAL"

    # 3. Host queries history (scoped to host_user)
    resp_host = client.get("/api/v1/history", headers=host_headers)
    assert resp_host.status_code == 200
    for item in resp_host.json()["items"]:
        assert item["host_id"] == host_user.id


def test_export_visitor_history_csv(client, host_user, receptionist_headers):
    now = datetime.now(timezone.utc)
    client.post(
        "/api/v1/visitors/register",
        json={
            "full_name": "Export Guest",
            "email": "export@guest.com",
            "phone": "555-7777",
            "purpose": "CSV Export Test",
            "scheduled_start_time": (now + timedelta(hours=1)).isoformat(),
            "host_id": host_user.id,
        },
    )

    resp = client.get(
        "/api/v1/history/export?visitor_name=Export Guest", headers=receptionist_headers
    )
    assert resp.status_code == 200
    assert "text/csv" in resp.headers.get("content-type", "")
    assert "Export Guest" in resp.text
    assert "CSV Export Test" in resp.text
    assert "Visit ID,Visitor Name,Visitor Email" in resp.text
