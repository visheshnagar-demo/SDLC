import io
from email.message import EmailMessage
from unittest.mock import patch


def test_health_check(client):
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"

    api_resp = client.get("/api/v1/health")
    assert api_resp.status_code == 200
    assert api_resp.json()["status"] == "healthy"


def test_classify_email_json_urgent(client):
    payload = {
        "text": "CRITICAL: Server outage detected in production cluster. Immediate action required!",
        "subject": "Urgent: Server Downtime Alert",
        "sender": "alerts@ops.company.com",
    }
    response = client.post("/api/v1/emails/classify", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert "id" in data
    assert data["sender"] == "alerts@ops.company.com"
    assert data["subject"] == "Urgent: Server Downtime Alert"
    assert data["source_type"] == "TEXT_ENTRY"
    assert data["classification"] is not None
    assert data["classification"]["primary_category"] == "Urgent"
    assert data["classification"]["confidence_score"] >= 80.0
    assert data["classification"]["is_overridden"] is False


def test_classify_email_json_work(client):
    payload = {
        "text": "Please review the attached project roadmap and sprint backlog deliverables before our architecture sync meeting on Thursday.",
        "subject": "Sprint Planning and Architecture Review",
        "sender": "lead@company.com",
    }
    response = client.post("/api/v1/emails/classify", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["classification"]["primary_category"] == "Work"
    assert data["classification"]["confidence_score"] >= 65.0


def test_classify_email_json_promotional(client):
    payload = {
        "text": "Limited time offer! Get 50% discount and save big on annual subscriptions. Use coupon code SAVE50 to shop now.",
        "subject": "Flash Sale: 50% Discount on Cloud Subscriptions",
        "sender": "offers@marketing.store.com",
    }
    response = client.post("/api/v1/emails/classify", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["classification"]["primary_category"] == "Promotional"


def test_classify_email_json_personal(client):
    payload = {
        "text": "Hey, let's get together for family dinner and birthday party this weekend at Mom and Dad's house. Let me know if you can make it!",
        "subject": "Weekend Family Birthday Party",
        "sender": "sister@family.com",
    }
    response = client.post("/api/v1/emails/classify", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["classification"]["primary_category"] == "Personal"


def test_classify_email_empty_payload(client):
    response = client.post("/api/v1/emails/classify", json={"text": "   "})
    assert response.status_code == 422


def test_classify_email_multipart_text(client):
    response = client.post(
        "/api/v1/emails/classify",
        data={
            "text": "Urgent emergency: Security breach incident reported. Immediate investigation needed.",
            "subject": "Security Alert Incident",
            "sender": "security@company.com",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["subject"] == "Security Alert Incident"
    assert data["classification"]["primary_category"] == "Urgent"


def test_classify_email_eml_upload(client):
    msg = EmailMessage()
    msg["From"] = "finance@company.com"
    msg["Subject"] = "Quarterly Budget & Invoice Review Meeting"
    msg["To"] = "team@company.com"
    msg.set_content(
        "Hi team, please find the quarterly budget report and invoice breakdown attached. Let's sync on deliverables."
    )

    eml_bytes = msg.as_bytes()
    files = {"file": ("budget_review.eml", io.BytesIO(eml_bytes), "message/rfc822")}

    response = client.post("/api/v1/emails/classify", files=files)
    assert response.status_code == 201
    data = response.json()
    assert data["source_type"] == "FILE_UPLOAD"
    assert data["file_name"] == "budget_review.eml"
    assert "finance@company.com" in data["sender"]
    assert "Quarterly Budget" in data["subject"]
    assert data["classification"]["primary_category"] == "Work"


def test_classify_email_txt_upload(client):
    txt_content = (
        b"From: boss@corp.com\n"
        b"Subject: Critical Outage in Production API\n\n"
        b"All hands on deck: production API is failing with high latency. Urgent action needed immediately!"
    )

    files = {"file": ("outage.txt", io.BytesIO(txt_content), "text/plain")}
    response = client.post("/api/v1/emails/classify", files=files)
    assert response.status_code == 201
    data = response.json()
    assert data["source_type"] == "FILE_UPLOAD"
    assert data["file_name"] == "outage.txt"
    assert data["classification"]["primary_category"] == "Urgent"


def test_classify_email_pdf_upload(client):
    # Minimal valid PDF with no extractable text
    pdf_bytes = (
        b"%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj "
        b"3 0 obj<</Type/Page/MediaBox[0 0 200 200]/Parent 2 0 R>>endobj\nxref\n0 4\n0000000000 65535 f \n"
        b"0000000009 00000 n \n0000000052 00000 n \n0000000108 00000 n \ntrailer<</Size 4/Root 1 0 R>>\n"
        b"startxref\n178\n%%EOF"
    )

    files = {"file": ("document.pdf", io.BytesIO(pdf_bytes), "application/pdf")}
    response = client.post("/api/v1/emails/classify", files=files)
    assert response.status_code == 400
    assert "extractable text" in response.json()["detail"]


def test_classify_email_unsupported_file_extension(client):
    files = {
        "file": (
            "malicious.exe",
            io.BytesIO(b"binary executable data"),
            "application/octet-stream",
        )
    }
    response = client.post("/api/v1/emails/classify", files=files)
    assert response.status_code == 400
    assert "Unsupported file format" in response.json()["detail"]


def test_classify_email_ai_timeout(client):
    async def mock_timeout(*args, **kwargs):
        raise TimeoutError(
            "AI categorization service timed out while analyzing email content."
        )

    with patch(
        "server.app.api.v1.emails.classify_email_content_async",
        side_effect=mock_timeout,
    ):
        response = client.post(
            "/api/v1/emails/classify",
            json={"text": "Regular email text for timeout test", "subject": "Test"},
        )
        assert response.status_code == 504
        assert "timed out" in response.json()["detail"]


def test_get_classified_emails_list(client):
    response = client.get("/api/v1/emails?skip=0&limit=10")
    assert response.status_code == 200
    data = response.json()
    assert "total" in data
    assert "items" in data
    assert isinstance(data["items"], list)
    assert data["total"] >= 4


def test_filter_by_category(client):
    response = client.get("/api/v1/emails?category=Urgent")
    assert response.status_code == 200
    data = response.json()
    for item in data["items"]:
        effective_cat = (
            item["classification"]["user_override_category"]
            if item["classification"]["is_overridden"]
            and item["classification"]["user_override_category"]
            else item["classification"]["ai_category"]
        )
        assert effective_cat == "Urgent"


def test_filter_by_search_keyword(client):
    response = client.get("/api/v1/emails?search=Replication")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 1
    assert any(
        "Replication" in item["subject"] or "Replication" in item["body_text"]
        for item in data["items"]
    )


def test_filter_by_min_confidence(client):
    response = client.get("/api/v1/emails?min_confidence=90.0")
    assert response.status_code == 200
    data = response.json()
    for item in data["items"]:
        assert item["classification"]["confidence_score"] >= 90.0


def test_get_single_email_by_id(client):
    list_resp = client.get("/api/v1/emails?limit=1")
    items = list_resp.json()["items"]
    assert len(items) > 0
    email_id = items[0]["id"]

    get_resp = client.get(f"/api/v1/emails/{email_id}")
    assert get_resp.status_code == 200
    assert get_resp.json()["id"] == email_id


def test_get_single_email_not_found(client):
    response = client.get("/api/v1/emails/00000000-0000-0000-0000-000000000000")
    assert response.status_code == 404


def test_override_classification(client):
    create_resp = client.post(
        "/api/v1/emails/classify",
        json={
            "text": "Hey friend, are we still meeting for lunch and coffee this weekend?",
            "subject": "Lunch Plans",
            "sender": "buddy@gmail.com",
        },
    )
    assert create_resp.status_code == 201
    email_id = create_resp.json()["id"]
    assert create_resp.json()["classification"]["primary_category"] == "Personal"

    patch_resp = client.patch(
        f"/api/v1/emails/{email_id}",
        json={"category": "Work"},
    )
    assert patch_resp.status_code == 200
    data = patch_resp.json()
    assert data["id"] == email_id
    assert data["classification"]["is_overridden"] is True
    assert data["classification"]["user_override_category"] == "Work"
    assert data["classification"]["primary_category"] == "Work"

    filter_resp = client.get("/api/v1/emails?category=Work")
    ids = [item["id"] for item in filter_resp.json()["items"]]
    assert email_id in ids


def test_override_invalid_category(client):
    list_resp = client.get("/api/v1/emails?limit=1")
    email_id = list_resp.json()["items"][0]["id"]

    response = client.patch(
        f"/api/v1/emails/{email_id}",
        json={"category": "InvalidCategoryName"},
    )
    assert response.status_code == 422


def test_metrics_endpoint(client):
    response = client.get("/api/v1/emails/metrics")
    assert response.status_code == 200
    data = response.json()
    assert "total_processed" in data
    assert "work_count" in data
    assert "personal_count" in data
    assert "urgent_count" in data
    assert "promotional_count" in data
    assert "overridden_count" in data
    assert data["total_processed"] >= 4


def test_delete_email(client):
    create_resp = client.post(
        "/api/v1/emails/classify",
        json={
            "text": "To be deleted email content",
            "subject": "Temporary Email",
        },
    )
    assert create_resp.status_code == 201
    email_id = create_resp.json()["id"]

    del_resp = client.delete(f"/api/v1/emails/{email_id}")
    assert del_resp.status_code == 204

    get_resp = client.get(f"/api/v1/emails/{email_id}")
    assert get_resp.status_code == 404
