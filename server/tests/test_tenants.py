def test_onboard_tenant_success(client):
    payload = {
        "name": "Stark Industries",
        "slug": "stark-ind",
        "domain": "stark.com",
        "admin_email": "tony@stark.com",
        "admin_full_name": "Tony Stark",
        "admin_password": "IronManSecret123!",
    }
    response = client.post("/api/v1/tenants", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Stark Industries"
    assert data["slug"] == "stark-ind"
    assert data["status"] == "Active"
    assert "id" in data
    assert "admin_user_id" in data


def test_onboard_tenant_duplicate_conflict(client):
    payload = {
        "name": "Acme Duplicate",
        "slug": "acme-corp",  # Duplicate slug seeded in conftest
        "domain": "acme-dup.com",
        "admin_email": "dup@acme.com",
        "admin_full_name": "Dup Admin",
        "admin_password": "Password123!",
    }
    response = client.post("/api/v1/tenants", json=payload)
    assert response.status_code == 409
    assert "already exists" in response.json()["detail"]


def test_list_tenants(client):
    response = client.get("/api/v1/tenants")
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "total" in data
    assert data["total"] >= 1


def test_get_tenant_details(client):
    response = client.get("/api/v1/tenants/acme-corp")
    assert response.status_code == 200
    data = response.json()
    assert data["slug"] == "acme-corp"
    assert data["name"] == "Acme Corporation"


def test_update_tenant_status(client):
    # Get acme-corp ID
    res = client.get("/api/v1/tenants/acme-corp")
    tenant_id = res.json()["id"]

    try:
        # Suspend tenant
        patch_res = client.patch(
            f"/api/v1/tenants/{tenant_id}/status", json={"status": "Suspended"}
        )
        assert patch_res.status_code == 200
        assert patch_res.json()["status"] == "Suspended"

        # Verify request with X-Tenant-ID header gets 403 Forbidden
        sub_res = client.get(
            f"/api/v1/tenants/{tenant_id}/config", headers={"X-Tenant-ID": tenant_id}
        )
        assert sub_res.status_code == 403
    finally:
        # Reactivate tenant
        react_res = client.patch(
            f"/api/v1/tenants/{tenant_id}/status", json={"status": "Active"}
        )
        assert react_res.status_code == 200
        assert react_res.json()["status"] == "Active"
