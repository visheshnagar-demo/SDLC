import io
from fastapi.testclient import TestClient


def test_health_check(client: TestClient):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}


def test_root_endpoint(client: TestClient):
    response = client.get("/")
    assert response.status_code == 200
    assert "status" in response.json()
    assert response.json()["status"] == "online"


def test_ingest_email_text_work(client: TestClient):
    payload = {
        "subject": "Sprint Review and Jira Backlog Grooming",
        "body": "Hi team, let's sync on the sprint deliverables and roadmap planning for the next release.",
    }
    response = client.post("/api/v1/emails/text", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["id"] is not None
    assert data["subject"] == "Sprint Review and Jira Backlog Grooming"
    assert data["category"] == "Work"
    assert data["confidence_score"] >= 0.50
    assert data["status"] == "PROCESSED"
    assert data["is_overridden"] is False
    assert len(data["audit_logs"]) >= 1


def test_ingest_email_text_urgent(client: TestClient):
    payload = {
        "subject": "CRITICAL ALERT: Production Database Outage",
        "body": "Emergency! High priority P1 incident. The primary database cluster is down. Action required immediately.",
    }
    response = client.post("/api/v1/emails/text", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["category"] == "Urgent"
    assert data["confidence_score"] >= 0.50


def test_ingest_email_text_promotional(client: TestClient):
    payload = {
        "subject": "Huge 70% Off Black Friday Sale!",
        "body": "Get exclusive discount coupon and special promotional pricing on all subscriptions today. Unsubscribe here.",
    }
    response = client.post("/api/v1/emails/text", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["category"] == "Promotional"
    assert data["confidence_score"] >= 0.50


def test_ingest_email_text_personal(client: TestClient):
    payload = {
        "subject": "Family Weekend Picnic and Birthday Dinner",
        "body": "Hey, let's have dinner with family this weekend to celebrate birthday. Hope to see you there for lunch!",
    }
    response = client.post("/api/v1/emails/text", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["category"] == "Personal"
    assert data["confidence_score"] >= 0.50


def test_ingest_email_text_uncategorized(client: TestClient):
    payload = {
        "subject": "Random note",
        "body": "1234567890 xyz abc",
    }
    response = client.post("/api/v1/emails/text", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["category"] == "Uncategorized"
    assert data["confidence_score"] < 0.50


def test_ingest_email_text_empty_body(client: TestClient):
    response = client.post(
        "/api/v1/emails/text", json={"subject": "Empty", "body": "   "}
    )
    assert response.status_code == 201
    data = response.json()
    assert data["category"] == "Uncategorized"


def test_upload_txt_file(client: TestClient):
    file_content = b"Subject: Client Contract Renewal\n\nPlease find attached the signed contract and invoice for review."
    files = {"file": ("contract.txt", io.BytesIO(file_content), "text/plain")}
    response = client.post("/api/v1/emails/upload", files=files)
    assert response.status_code == 201
    data = response.json()
    assert data["file_name"] == "contract.txt"
    assert data["file_type"] == ".txt"
    assert data["category"] == "Work"


def test_upload_eml_file(client: TestClient):
    eml_data = (
        b"From: alerts@corp.com\r\n"
        b"To: admin@corp.com\r\n"
        b"Subject: Emergency Alert: Server Breach Detected\r\n"
        b"Content-Type: text/plain; charset=utf-8\r\n\r\n"
        b"Immediate action required! Security breach incident detected on server."
    )
    files = {"file": ("alert.eml", io.BytesIO(eml_data), "message/rfc822")}
    response = client.post("/api/v1/emails/upload", files=files)
    assert response.status_code == 201
    data = response.json()
    assert data["file_name"] == "alert.eml"
    assert data["file_type"] == ".eml"
    assert data["category"] == "Urgent"


def test_upload_unsupported_file(client: TestClient):
    files = {"file": ("test.pdf", io.BytesIO(b"binary content"), "application/pdf")}
    response = client.post("/api/v1/emails/upload", files=files)
    assert response.status_code == 400
    assert "Unsupported file format" in response.json()["detail"]


def test_upload_file_too_large(client: TestClient):
    large_content = b"x" * (10 * 1024 * 1024 + 100)
    files = {"file": ("huge.txt", io.BytesIO(large_content), "text/plain")}
    response = client.post("/api/v1/emails/upload", files=files)
    assert response.status_code == 400


def test_list_and_filter_emails(client: TestClient):
    client.post(
        "/api/v1/emails/text",
        json={"subject": "Urgent Server Fix", "body": "Critical issue asap."},
    )
    client.post(
        "/api/v1/emails/text",
        json={"subject": "Family Party", "body": "Dinner this weekend."},
    )

    res = client.get("/api/v1/emails?limit=10")
    assert res.status_code == 200
    data = res.json()
    assert "items" in data
    assert data["total"] >= 2

    res_urgent = client.get("/api/v1/emails?category=Urgent")
    assert res_urgent.status_code == 200
    for item in res_urgent.json()["items"]:
        assert item["category"] == "Urgent"

    res_search = client.get("/api/v1/emails?search=Server")
    assert res_search.status_code == 200
    assert len(res_search.json()["items"]) >= 1


def test_get_email_by_id(client: TestClient):
    created = client.post(
        "/api/v1/emails/text",
        json={"subject": "Test Email", "body": "Project standup notes."},
    ).json()
    email_id = created["id"]

    res = client.get(f"/api/v1/emails/{email_id}")
    assert res.status_code == 200
    assert res.json()["id"] == email_id

    res_404 = client.get("/api/v1/emails/non-existent-uuid")
    assert res_404.status_code == 404


def test_override_email_category(client: TestClient):
    created = client.post(
        "/api/v1/emails/text",
        json={"subject": "General Meeting", "body": "Discuss project sprint."},
    ).json()
    email_id = created["id"]
    assert created["category"] == "Work"
    assert created["is_overridden"] is False

    override_payload = {
        "category": "Urgent",
        "reason": "Escalated by director",
    }
    res = client.patch(f"/api/v1/emails/{email_id}/override", json=override_payload)
    assert res.status_code == 200
    updated = res.json()
    assert updated["category"] == "Urgent"
    assert updated["is_overridden"] is True
    assert updated["original_category"] == "Work"
    assert len(updated["audit_logs"]) >= 2
    assert updated["audit_logs"][0]["action"] == "MANUAL_OVERRIDE"

    invalid_res = client.patch(
        f"/api/v1/emails/{email_id}/override", json={"category": "InvalidCategory"}
    )
    assert invalid_res.status_code == 400


def test_stats_endpoint(client: TestClient):
    client.post(
        "/api/v1/emails/text",
        json={"subject": "Urgent", "body": "Immediate emergency alert"},
    )
    client.post(
        "/api/v1/emails/text",
        json={"subject": "Promo", "body": "Discount coupon sale unsubscribe"},
    )

    res = client.get("/api/v1/emails/stats")
    assert res.status_code == 200
    stats = res.json()
    assert stats["total"] >= 2
    assert stats["urgent"] >= 1
    assert stats["promotional"] >= 1
