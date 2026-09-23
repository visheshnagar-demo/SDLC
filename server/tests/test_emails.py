import io


def test_health_and_root(client):
    res_health = client.get("/health")
    assert res_health.status_code == 200
    assert res_health.json()["status"] == "healthy"

    res_root = client.get("/")
    assert res_root.status_code == 200
    assert "docs_url" in res_root.json()


def test_ingest_email_text_urgent_category(client):
    payload = {
        "subject": "CRITICAL ALERT: Production Server SSL Expiring in 24h",
        "body": "Immediate action required. Please fix the server outage and certificate ASAP.",
    }
    response = client.post("/api/v1/emails/text", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["id"] is not None
    assert data["subject"] == payload["subject"]
    assert data["category"] == "Urgent"
    assert data["original_category"] == "Urgent"
    assert data["confidence_score"] >= 0.50
    assert data["status"] == "PROCESSED"
    assert data["is_overridden"] is False
    assert "created_at" in data


def test_ingest_email_text_work_category(client):
    payload = {
        "subject": "Q3 Financial Review & Sprint Planning Agenda",
        "body": "Hi team, please find the presentation and deliverable report for our quarterly meeting.",
    }
    response = client.post("/api/v1/emails/text", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["category"] == "Work"
    assert data["confidence_score"] >= 0.50
    assert data["status"] == "PROCESSED"


def test_ingest_email_text_promotional_category(client):
    payload = {
        "subject": "Black Friday Special Deal - 50% Off Everything!",
        "body": "Exclusive discount coupon! Shop now and save big before the sale ends. Unsubscribe anytime.",
    }
    response = client.post("/api/v1/emails/text", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["category"] == "Promotional"
    assert data["confidence_score"] >= 0.50


def test_ingest_email_text_personal_category(client):
    payload = {
        "subject": "Weekend Family Birthday Party & Dinner",
        "body": "Hey, let's catch up this weekend for dinner with mom and dad at home!",
    }
    response = client.post("/api/v1/emails/text", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["category"] == "Personal"
    assert data["confidence_score"] >= 0.50


def test_ingest_email_text_uncategorized_empty(client):
    payload = {"subject": "", "body": "     "}
    response = client.post("/api/v1/emails/text", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["category"] == "Uncategorized"
    assert data["confidence_score"] == 0.0


def test_ingest_email_upload_txt_file(client):
    content = b"Subject: Team Sync Agenda\n\nLet us review the sprint roadmap and client deliverables."
    file_obj = io.BytesIO(content)
    response = client.post(
        "/api/v1/emails/upload", files={"file": ("agenda.txt", file_obj, "text/plain")}
    )
    assert response.status_code == 201
    data = response.json()
    assert data["file_name"] == "agenda.txt"
    assert data["file_type"] == ".txt"
    assert data["category"] == "Work"
    assert data["status"] == "PROCESSED"


def test_ingest_email_upload_eml_file(client):
    eml_content = (
        b"From: store@shop.com\r\n"
        b"To: user@example.com\r\n"
        b"Subject: Huge 70% Discount and Coupon Offer\r\n"
        b"Content-Type: text/plain; charset=utf-8\r\n\r\n"
        b"Don't miss our exclusive clearance promotion sale. Buy now to save big!\r\n"
    )
    file_obj = io.BytesIO(eml_content)
    response = client.post(
        "/api/v1/emails/upload",
        files={"file": ("newsletter.eml", file_obj, "message/rfc822")},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["file_name"] == "newsletter.eml"
    assert data["file_type"] == ".eml"
    assert data["category"] == "Promotional"


def test_ingest_email_upload_msg_file(client):
    msg_content = b"Subject: Urgent Incident Report\r\n\r\nCritical production emergency alert and high priority outage."
    file_obj = io.BytesIO(msg_content)
    response = client.post(
        "/api/v1/emails/upload",
        files={"file": ("alert.msg", file_obj, "application/vnd.ms-outlook")},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["file_name"] == "alert.msg"
    assert data["file_type"] == ".msg"
    assert data["category"] == "Urgent"


def test_ingest_email_upload_file_size_limit_exceeded(client):
    large_content = b"A" * (10 * 1024 * 1024 + 100)  # > 10MB
    file_obj = io.BytesIO(large_content)
    response = client.post(
        "/api/v1/emails/upload",
        files={"file": ("large_file.txt", file_obj, "text/plain")},
    )
    assert response.status_code == 400
    assert "10MB" in response.json()["detail"]


def test_ingest_email_upload_invalid_extension(client):
    pdf_content = b"%PDF-1.4 mock content"
    file_obj = io.BytesIO(pdf_content)
    response = client.post(
        "/api/v1/emails/upload",
        files={"file": ("document.pdf", file_obj, "application/pdf")},
    )
    assert response.status_code == 400
    assert "Unsupported file format" in response.json()["detail"]


def test_list_and_filter_emails(client):
    # Ingest 3 distinct emails
    client.post(
        "/api/v1/emails/text",
        json={"subject": "Project Meeting", "body": "Quarterly sprint review."},
    )
    client.post(
        "/api/v1/emails/text",
        json={
            "subject": "Urgent Alert",
            "body": "Emergency action required immediately.",
        },
    )
    client.post(
        "/api/v1/emails/text",
        json={"subject": "Family BBQ", "body": "Weekend birthday party dinner."},
    )

    # List all
    res_all = client.get("/api/v1/emails?skip=0&limit=10")
    assert res_all.status_code == 200
    data_all = res_all.json()
    assert data_all["total"] >= 3
    assert len(data_all["items"]) >= 3

    # Filter by category
    res_urgent = client.get("/api/v1/emails?category=Urgent")
    assert res_urgent.status_code == 200
    data_urgent = res_urgent.json()
    for item in data_urgent["items"]:
        assert item["category"] == "Urgent"

    # Search
    res_search = client.get("/api/v1/emails?search=BBQ")
    assert res_search.status_code == 200
    data_search = res_search.json()
    assert data_search["total"] >= 1
    assert any("BBQ" in (item["subject"] or "") for item in data_search["items"])


def test_get_email_detail(client):
    res_create = client.post(
        "/api/v1/emails/text",
        json={"subject": "Meeting", "body": "Weekly review sync."},
    )
    email_id = res_create.json()["id"]

    res_get = client.get(f"/api/v1/emails/{email_id}")
    assert res_get.status_code == 200
    assert res_get.json()["id"] == email_id
    assert res_get.json()["body"] == "Weekly review sync."

    res_not_found = client.get("/api/v1/emails/00000000-0000-0000-0000-000000000000")
    assert res_not_found.status_code == 404


def test_override_email_classification(client):
    # Ingest email classified as Work
    res_create = client.post(
        "/api/v1/emails/text",
        json={
            "subject": "Contract Deliverable",
            "body": "Financial review presentation roadmap.",
        },
    )
    email_id = res_create.json()["id"]
    original_cat = res_create.json()["category"]
    assert res_create.json()["is_overridden"] is False

    # Manual override to Urgent
    res_override = client.patch(
        f"/api/v1/emails/{email_id}/override", json={"category": "Urgent"}
    )
    assert res_override.status_code == 200
    data_override = res_override.json()
    assert data_override["id"] == email_id
    assert data_override["category"] == "Urgent"
    assert data_override["original_category"] == original_cat
    assert data_override["is_overridden"] is True

    # Test invalid category
    res_invalid = client.patch(
        f"/api/v1/emails/{email_id}/override", json={"category": "InvalidCategory"}
    )
    assert res_invalid.status_code == 400

    # Test override on non-existent email
    res_404 = client.patch(
        "/api/v1/emails/00000000-0000-0000-0000-000000000000/override",
        json={"category": "Personal"},
    )
    assert res_404.status_code == 404
