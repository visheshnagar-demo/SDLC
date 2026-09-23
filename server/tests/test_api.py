import io
import datetime
from fastapi.testclient import TestClient


def test_health_check(client: TestClient):
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "personal-warranty-manager"


# ==========================================
# AUTH TESTS
# ==========================================


def test_auth_register_and_login(client: TestClient):
    # Register new user
    reg_payload = {
        "email": "newuser@example.com",
        "password": "securepassword123",
        "full_name": "New User",
    }
    reg_resp = client.post("/api/v1/auth/register", json=reg_payload)
    assert reg_resp.status_code == 201
    reg_data = reg_resp.json()
    assert "access_token" in reg_data
    assert reg_data["user"]["email"] == "newuser@example.com"

    # Duplicate registration should fail
    dup_resp = client.post("/api/v1/auth/register", json=reg_payload)
    assert dup_resp.status_code == 400
    assert "already exists" in dup_resp.json()["detail"]

    # Login with JSON
    login_resp = client.post(
        "/api/v1/auth/login",
        json={"email": "newuser@example.com", "password": "securepassword123"},
    )
    assert login_resp.status_code == 200
    assert "access_token" in login_resp.json()

    # Login with invalid password
    bad_login = client.post(
        "/api/v1/auth/login",
        json={"email": "newuser@example.com", "password": "wrongpassword"},
    )
    assert bad_login.status_code == 401

    # Get profile
    token = login_resp.json()["access_token"]
    me_resp = client.get(
        "/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"}
    )
    assert me_resp.status_code == 200
    assert me_resp.json()["email"] == "newuser@example.com"


# ==========================================
# AC 1: PRODUCT REGISTRATION & CATEGORIZATION
# ==========================================


def test_product_registration_success(client: TestClient, auth_headers: dict):
    today = datetime.date.today().isoformat()
    product_payload = {
        "name": "Dell XPS 15",
        "brand": "Dell",
        "category": "Electronics",
        "purchase_date": today,
        "serial_number": "SN-DELL-987654",
        "purchase_price": 1850.00,
        "vendor": "Dell Online",
        "notes": "Work laptop with premium warranty",
        "coverage_duration_months": 24,
        "coverage_type": "Manufacturer",
    }
    response = client.post(
        "/api/v1/products", json=product_payload, headers=auth_headers
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Dell XPS 15"
    assert data["brand"] == "Dell"
    assert data["category"] == "Electronics"
    assert data["purchase_date"] == today
    assert data["purchase_price"] == 1850.00
    assert len(data["warranties"]) == 1
    assert data["warranties"][0]["coverage_duration_months"] == 24


def test_product_registration_future_date_rejected(
    client: TestClient, auth_headers: dict
):
    future_date = (datetime.date.today() + datetime.timedelta(days=10)).isoformat()
    product_payload = {
        "name": "Future Drone",
        "brand": "DJI",
        "category": "Gadgets",
        "purchase_date": future_date,
        "purchase_price": 999.00,
    }
    response = client.post(
        "/api/v1/products", json=product_payload, headers=auth_headers
    )
    assert response.status_code == 422
    assert "Purchase date cannot be in the future" in response.text


def test_product_registration_missing_fields_rejected(
    client: TestClient, auth_headers: dict
):
    incomplete_payload = {
        "name": "Incomplete Product",
        # Missing brand, category, purchase_date
    }
    response = client.post(
        "/api/v1/products", json=incomplete_payload, headers=auth_headers
    )
    assert response.status_code == 422


def test_product_listing_and_filtering(client: TestClient, auth_headers: dict):
    today = datetime.date.today().isoformat()
    client.post(
        "/api/v1/products",
        json={
            "name": "Sony Bravia TV",
            "brand": "Sony",
            "category": "Home Entertainment",
            "purchase_date": today,
            "purchase_price": 1200.00,
        },
        headers=auth_headers,
    )

    # List all
    list_resp = client.get("/api/v1/products", headers=auth_headers)
    assert list_resp.status_code == 200
    data = list_resp.json()
    assert data["total"] >= 1
    assert any(p["brand"] == "Sony" for p in data["items"])

    # Filter by category
    cat_resp = client.get(
        "/api/v1/products?category=Home Entertainment", headers=auth_headers
    )
    assert cat_resp.status_code == 200
    cat_data = cat_resp.json()
    assert all("Home Entertainment" in p["category"] for p in cat_data["items"])

    # Search keyword
    search_resp = client.get("/api/v1/products?search=Bravia", headers=auth_headers)
    assert search_resp.status_code == 200
    search_data = search_resp.json()
    assert len(search_data["items"]) >= 1
    assert "Bravia" in search_data["items"][0]["name"]


def test_product_update_and_delete(client: TestClient, auth_headers: dict):
    today = datetime.date.today().isoformat()
    create_resp = client.post(
        "/api/v1/products",
        json={
            "name": "KitchenAid Stand Mixer",
            "brand": "KitchenAid",
            "category": "Appliances",
            "purchase_date": today,
            "purchase_price": 450.00,
        },
        headers=auth_headers,
    )
    product_id = create_resp.json()["id"]

    # Update
    update_resp = client.put(
        f"/api/v1/products/{product_id}",
        json={"name": "KitchenAid Artisan Stand Mixer", "purchase_price": 420.00},
        headers=auth_headers,
    )
    assert update_resp.status_code == 200
    assert update_resp.json()["name"] == "KitchenAid Artisan Stand Mixer"
    assert update_resp.json()["purchase_price"] == 420.00

    # Delete
    del_resp = client.delete(f"/api/v1/products/{product_id}", headers=auth_headers)
    assert del_resp.status_code == 204

    # Verify not found
    get_resp = client.get(f"/api/v1/products/{product_id}", headers=auth_headers)
    assert get_resp.status_code == 404


# ==========================================
# AC 2: WARRANTY TRACKING & EXPIRATION ALERTS
# ==========================================


def test_warranty_expiration_calculation(client: TestClient, auth_headers: dict):
    today = datetime.date.today()
    past_date = today - datetime.timedelta(days=100)

    # 1. Create product
    prod_resp = client.post(
        "/api/v1/products",
        json={
            "name": "iPad Pro",
            "brand": "Apple",
            "category": "Electronics",
            "purchase_date": past_date.isoformat(),
            "purchase_price": 1100.00,
        },
        headers=auth_headers,
    )
    prod_id = prod_resp.json()["id"]

    # 2. Create standard 12-month warranty
    war_resp = client.post(
        "/api/v1/warranties",
        json={
            "product_id": prod_id,
            "coverage_duration_months": 12,
            "coverage_type": "Standard",
            "provider_name": "AppleCare",
        },
        headers=auth_headers,
    )
    assert war_resp.status_code == 201
    war_data = war_resp.json()
    assert war_data["status"] == "Active"
    assert war_data["expiration_date"] is not None

    # 3. Create Lifetime warranty
    lifetime_resp = client.post(
        "/api/v1/warranties",
        json={
            "product_id": prod_id,
            "coverage_duration_months": 0,
            "coverage_type": "Lifetime",
            "provider_name": "Apple Lifetime Support",
        },
        headers=auth_headers,
    )
    assert lifetime_resp.status_code == 201
    life_data = lifetime_resp.json()
    assert life_data["status"] == "Lifetime"
    assert life_data["expiration_date"] is None


def test_warranty_expiration_alerts_endpoint(client: TestClient, auth_headers: dict):
    today = datetime.date.today()
    # Product with warranty expiring in 10 days
    start_date = today - datetime.timedelta(days=355)

    prod_resp = client.post(
        "/api/v1/products",
        json={
            "name": "Bose SoundLink",
            "brand": "Bose",
            "category": "Audio",
            "purchase_date": start_date.isoformat(),
            "purchase_price": 199.00,
        },
        headers=auth_headers,
    )
    prod_id = prod_resp.json()["id"]

    client.post(
        "/api/v1/warranties",
        json={
            "product_id": prod_id,
            "coverage_duration_months": 12,
            "coverage_type": "Standard",
        },
        headers=auth_headers,
    )

    alerts_resp = client.get("/api/v1/alerts", headers=auth_headers)
    assert alerts_resp.status_code == 200
    alerts_data = alerts_resp.json()
    assert alerts_data["total"] >= 1
    assert any(a["product_id"] == prod_id for a in alerts_data["items"])

    # Test dashboard stats
    dash_resp = client.get("/api/v1/alerts/dashboard", headers=auth_headers)
    assert dash_resp.status_code == 200
    dash_data = dash_resp.json()
    assert dash_data["total_products"] >= 1
    assert dash_data["expiring_soon_count"] >= 1


# ==========================================
# AC 3: DOCUMENT MANAGEMENT
# ==========================================


def test_document_upload_success(client: TestClient, auth_headers: dict):
    today = datetime.date.today().isoformat()
    prod_resp = client.post(
        "/api/v1/products",
        json={
            "name": "Canon EOS R6",
            "brand": "Canon",
            "category": "Photography",
            "purchase_date": today,
            "purchase_price": 2499.00,
        },
        headers=auth_headers,
    )
    prod_id = prod_resp.json()["id"]

    # Upload PDF receipt
    pdf_content = b"%PDF-1.4 Mock Receipt File Content"
    upload_resp = client.post(
        "/api/v1/documents/upload",
        data={"product_id": prod_id, "document_type": "receipt"},
        files={
            "file": ("canon_receipt.pdf", io.BytesIO(pdf_content), "application/pdf")
        },
        headers=auth_headers,
    )
    assert upload_resp.status_code == 201
    doc_data = upload_resp.json()
    assert doc_data["filename"] == "canon_receipt.pdf"
    assert doc_data["mime_type"] == "application/pdf"
    assert doc_data["file_size"] == len(pdf_content)
    assert "download_url" in doc_data
    doc_id = doc_data["id"]

    # Download document
    down_resp = client.get(f"/api/v1/documents/{doc_id}/download", headers=auth_headers)
    assert down_resp.status_code == 200
    assert down_resp.content == pdf_content

    # Delete document
    del_doc = client.delete(f"/api/v1/documents/{doc_id}", headers=auth_headers)
    assert del_doc.status_code == 204


def test_document_upload_unsupported_format_rejected(
    client: TestClient, auth_headers: dict
):
    today = datetime.date.today().isoformat()
    prod_resp = client.post(
        "/api/v1/products",
        json={
            "name": "Nikon Z8",
            "brand": "Nikon",
            "category": "Photography",
            "purchase_date": today,
            "purchase_price": 3999.00,
        },
        headers=auth_headers,
    )
    prod_id = prod_resp.json()["id"]

    # Upload invalid format (e.g. text/plain or application/zip)
    bad_file = b"Some script content"
    upload_resp = client.post(
        "/api/v1/documents/upload",
        data={"product_id": prod_id, "document_type": "invoice"},
        files={
            "file": ("malicious.exe", io.BytesIO(bad_file), "application/x-msdownload")
        },
        headers=auth_headers,
    )
    assert upload_resp.status_code == 400
    assert "Unsupported file" in upload_resp.json()["detail"]


def test_document_upload_size_limit_rejected(client: TestClient, auth_headers: dict):
    today = datetime.date.today().isoformat()
    prod_resp = client.post(
        "/api/v1/products",
        json={
            "name": "LG OLED TV",
            "brand": "LG",
            "category": "Electronics",
            "purchase_date": today,
            "purchase_price": 1500.00,
        },
        headers=auth_headers,
    )
    prod_id = prod_resp.json()["id"]

    # Exceeding 10MB (11MB)
    huge_file = b"0" * (11 * 1024 * 1024)
    upload_resp = client.post(
        "/api/v1/documents/upload",
        data={"product_id": prod_id, "document_type": "receipt"},
        files={"file": ("huge_receipt.pdf", io.BytesIO(huge_file), "application/pdf")},
        headers=auth_headers,
    )
    assert upload_resp.status_code == 400
    assert "exceeds maximum" in upload_resp.json()["detail"]


# ==========================================
# AC 4: REPAIR & CLAIM HISTORY LOGGING
# ==========================================


def test_claim_creation_and_lifecycle(client: TestClient, auth_headers: dict):
    today = datetime.date.today()
    purchase_date = today - datetime.timedelta(days=90)

    # 1. Register product & active warranty
    prod_resp = client.post(
        "/api/v1/products",
        json={
            "name": "Samsung Galaxy S24",
            "brand": "Samsung",
            "category": "Smartphones",
            "purchase_date": purchase_date.isoformat(),
            "purchase_price": 899.00,
            "coverage_duration_months": 12,
        },
        headers=auth_headers,
    )
    prod_id = prod_resp.json()["id"]

    # 2. Log claim for active warranty
    claim_payload = {
        "product_id": prod_id,
        "claim_date": today.isoformat(),
        "issue_description": "Microphone distortion during phone calls",
        "status": "Pending",
        "service_center": "Samsung Care+ Authorized Service",
        "repair_cost": 85.00,
        "resolution_notes": "Diagnostic appointment scheduled",
    }
    claim_resp = client.post("/api/v1/claims", json=claim_payload, headers=auth_headers)
    assert claim_resp.status_code == 201
    claim_data = claim_resp.json()
    assert claim_data["issue_description"] == "Microphone distortion during phone calls"
    assert claim_data["status"] == "Pending"
    assert claim_data["repair_cost"] == 85.00
    assert claim_data["product_name"] == "Samsung Galaxy S24"
    claim_id = claim_data["id"]

    # 3. Update claim status to Resolved
    update_claim_resp = client.patch(
        f"/api/v1/claims/{claim_id}",
        json={
            "status": "Resolved",
            "resolution_notes": "Microphone module replaced free of charge under warranty.",
        },
        headers=auth_headers,
    )
    assert update_claim_resp.status_code == 200
    assert update_claim_resp.json()["status"] == "Resolved"

    # 4. List claims with status filter
    claims_list = client.get("/api/v1/claims?status=Resolved", headers=auth_headers)
    assert claims_list.status_code == 200
    assert any(c["id"] == claim_id for c in claims_list.json()["items"])


def test_claim_on_expired_warranty_displays_warning(
    client: TestClient, auth_headers: dict
):
    today = datetime.date.today()
    old_purchase_date = today - datetime.timedelta(days=800)

    # Register product with 12 month warranty that expired ~435 days ago
    prod_resp = client.post(
        "/api/v1/products",
        json={
            "name": "Vintage Espresso Machine",
            "brand": "Breville",
            "category": "Appliances",
            "purchase_date": old_purchase_date.isoformat(),
            "purchase_price": 700.00,
            "coverage_duration_months": 12,
        },
        headers=auth_headers,
    )
    prod_id = prod_resp.json()["id"]

    # Log claim on expired product
    claim_payload = {
        "product_id": prod_id,
        "claim_date": today.isoformat(),
        "issue_description": "Pump pressure failure",
        "status": "In Progress",
        "service_center": "Local Repair Shop",
        "repair_cost": 120.00,
        "resolution_notes": "Out of warranty repair",
    }
    claim_resp = client.post("/api/v1/claims", json=claim_payload, headers=auth_headers)
    assert claim_resp.status_code == 201
    claim_data = claim_resp.json()
    assert claim_data["warning"] is not None
    assert "Warning" in claim_data["warning"]
    assert "expired" in claim_data["warning"].lower()


# ==========================================
# TENANT ISOLATION TESTS
# ==========================================


def test_tenant_isolation(client: TestClient, auth_headers: dict):
    # Register second user
    client.post(
        "/api/v1/auth/register",
        json={"email": "otheruser@example.com", "password": "password123"},
    )
    other_login = client.post(
        "/api/v1/auth/login",
        json={"email": "otheruser@example.com", "password": "password123"},
    )
    other_token = other_login.json()["access_token"]
    other_headers = {"Authorization": f"Bearer {other_token}"}

    # User 1 creates product
    today = datetime.date.today().isoformat()
    p1 = client.post(
        "/api/v1/products",
        json={
            "name": "User 1 Secret Device",
            "brand": "BrandX",
            "category": "Gadgets",
            "purchase_date": today,
            "purchase_price": 500.00,
        },
        headers=auth_headers,
    ).json()

    # User 2 cannot access User 1's product
    get_p1_by_u2 = client.get(f"/api/v1/products/{p1['id']}", headers=other_headers)
    assert get_p1_by_u2.status_code == 404

    # User 2 cannot see User 1's product in list
    u2_list = client.get("/api/v1/products", headers=other_headers).json()
    assert not any(p["id"] == p1["id"] for p in u2_list["items"])
