import io


def test_health_check(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_ingest_text_email_work(client):
    payload = {
        "subject": "Sprint Planning Meeting Agenda",
        "body": "Hi team, let's review the Q4 project deliverables, sprint tasks, and client reports during tomorrow's sync.",
    }
    response = client.post("/api/v1/emails/text", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["subject"] == payload["subject"]
    assert data["category"] == "Work"
    assert data["confidence_score"] >= 0.50
    assert data["status"] == "PROCESSED"
    assert data["is_overridden"] is False
    assert data["id"] is not None


def test_ingest_text_email_urgent(client):
    payload = {
        "subject": "CRITICAL ALERT: Production Database Outage",
        "body": "Immediate action required! The primary production database has failed. Execute emergency runbook asap.",
    }
    response = client.post("/api/v1/emails/text", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["category"] == "Urgent"
    assert data["confidence_score"] >= 0.70


def test_ingest_text_email_personal(client):
    payload = {
        "subject": "Dinner plans this weekend",
        "body": "Hey, do you want to join our family BBQ dinner and movie night this Saturday?",
    }
    response = client.post("/api/v1/emails/text", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["category"] == "Personal"
    assert data["confidence_score"] >= 0.50


def test_ingest_text_email_promotional(client):
    payload = {
        "subject": "Limited Time: 50% Off Everything!",
        "body": "Massive clearance sale! Use promo coupon code SAVE50 to claim your special discount offer today.",
    }
    response = client.post("/api/v1/emails/text", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["category"] == "Promotional"
    assert data["confidence_score"] >= 0.50


def test_ingest_text_email_empty_or_whitespace(client):
    payload = {
        "subject": "",
        "body": "   ",
    }
    response = client.post("/api/v1/emails/text", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["category"] == "Uncategorized"
    assert data["confidence_score"] == 0.00


def test_ingest_file_eml(client):
    eml_content = (
        b"From: devops@example.com\r\n"
        b"To: team@example.com\r\n"
        b"Subject: URGENT: SSL Certificate Expiry Alert\r\n"
        b"Content-Type: text/plain; charset=utf-8\r\n"
        b"\r\n"
        b"Immediate action required. The wildcard SSL certificate will expire in 24 hours.\r\n"
    )
    files = {"file": ("alert.eml", io.BytesIO(eml_content), "message/rfc822")}
    response = client.post("/api/v1/emails/upload", files=files)
    assert response.status_code == 201
    data = response.json()
    assert data["subject"] == "URGENT: SSL Certificate Expiry Alert"
    assert data["file_name"] == "alert.eml"
    assert data["file_type"] == ".eml"
    assert data["category"] == "Urgent"


def test_ingest_file_txt(client):
    txt_content = b"Subject: Quarterly Budget Presentation\nHi team, please find the presentation slides for the quarterly budget review."
    files = {"file": ("budget.txt", io.BytesIO(txt_content), "text/plain")}
    response = client.post("/api/v1/emails/upload", files=files)
    assert response.status_code == 201
    data = response.json()
    assert data["subject"] == "Quarterly Budget Presentation"
    assert data["file_type"] == ".txt"
    assert data["category"] == "Work"


def test_ingest_file_invalid_extension(client):
    pdf_content = b"%PDF-1.4 dummy binary content"
    files = {"file": ("document.pdf", io.BytesIO(pdf_content), "application/pdf")}
    response = client.post("/api/v1/emails/upload", files=files)
    assert response.status_code == 400
    assert "Unsupported file format" in response.json()["detail"]


def test_ingest_file_too_large(client):
    # 10MB + 1 byte
    large_content = b"A" * (10 * 1024 * 1024 + 1)
    files = {"file": ("large.txt", io.BytesIO(large_content), "text/plain")}
    response = client.post("/api/v1/emails/upload", files=files)
    assert response.status_code == 400
    assert "exceeds maximum allowed limit" in response.json()["detail"]


def test_list_and_filter_emails(client):
    # Seed 2 distinct items
    client.post(
        "/api/v1/emails/text",
        json={"subject": "Alpha project", "body": "Project task deliverable"},
    )
    client.post(
        "/api/v1/emails/text",
        json={"subject": "Beta vacation", "body": "Family vacation trip dinner"},
    )

    # Test list all
    response = client.get("/api/v1/emails?skip=0&limit=10")
    assert response.status_code == 200
    data = response.json()
    assert "total" in data
    assert "items" in data
    assert data["total"] >= 2
    assert len(data["items"]) >= 2

    # Test category filter
    response_work = client.get("/api/v1/emails?category=Work")
    assert response_work.status_code == 200
    for item in response_work.json()["items"]:
        assert item["category"] == "Work"

    # Test search filter
    response_search = client.get("/api/v1/emails?search=vacation")
    assert response_search.status_code == 200
    search_items = response_search.json()["items"]
    assert len(search_items) >= 1
    assert any(
        "vacation" in (item["subject"] or "").lower()
        or "vacation" in item["body"].lower()
        for item in search_items
    )


def test_get_email_by_id_and_not_found(client):
    create_resp = client.post(
        "/api/v1/emails/text",
        json={"subject": "Unique Subject", "body": "Some email text content"},
    )
    email_id = create_resp.json()["id"]

    get_resp = client.get(f"/api/v1/emails/{email_id}")
    assert get_resp.status_code == 200
    assert get_resp.json()["id"] == email_id

    not_found_resp = client.get("/api/v1/emails/non-existent-uuid-12345")
    assert not_found_resp.status_code == 404


def test_manual_override_category(client):
    create_resp = client.post(
        "/api/v1/emails/text",
        json={
            "subject": "Ambiguous Subject",
            "body": "General text without clear keywords",
        },
    )
    email_id = create_resp.json()["id"]
    original_category = create_resp.json()["category"]

    override_payload = {
        "category": "Work",
        "reason": "Business user manual classification override",
    }
    override_resp = client.patch(
        f"/api/v1/emails/{email_id}/override", json=override_payload
    )
    assert override_resp.status_code == 200
    updated = override_resp.json()
    assert updated["category"] == "Work"
    assert updated["is_overridden"] is True
    assert updated["original_category"] == original_category
    assert len(updated["audit_logs"]) >= 1
    assert updated["audit_logs"][0]["previous_category"] == original_category
    assert updated["audit_logs"][0]["new_category"] == "Work"
    assert (
        updated["audit_logs"][0]["reason"]
        == "Business user manual classification override"
    )


def test_manual_override_invalid_category(client):
    create_resp = client.post(
        "/api/v1/emails/text",
        json={"subject": "Test", "body": "Test message body"},
    )
    email_id = create_resp.json()["id"]

    override_resp = client.patch(
        f"/api/v1/emails/{email_id}/override", json={"category": "InvalidCategory"}
    )
    assert override_resp.status_code == 400
