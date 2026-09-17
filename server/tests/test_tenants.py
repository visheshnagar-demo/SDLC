def test_health_check(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_create_tenant_success(client):
    payload = {
        "name": "Acme Corp",
        "slug": "acme",
        "admin_email": "admin@acme.com",
        "tier": "Enterprise",
        "max_users": 500,
        "storage_limit_gb": 1000,
        "rate_limit_rpm": 10000,
    }
    response = client.post("/api/v1/tenants", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Acme Corp"
    assert data["slug"] == "acme"
    assert data["tier"] == "Enterprise"
    assert data["max_users"] == 500
    assert data["status"] == "Active"
    assert "id" in data


def test_create_tenant_duplicate_slug_conflict(client):
    payload = {
        "name": "Acme Duplicate",
        "slug": "acme",
        "admin_email": "admin2@acme.com",
        "tier": "Free",
    }
    response = client.post("/api/v1/tenants", json=payload)
    assert response.status_code == 409
    assert "already exists" in response.json()["detail"]


def test_list_tenants_and_filtering(client):
    response = client.get("/api/v1/tenants?tier=Enterprise")
    assert response.status_code == 200
    tenants = response.json()
    assert isinstance(tenants, list)
    assert len(tenants) >= 1
    assert any(t["slug"] == "acme" for t in tenants)


def test_get_tenant_detail(client):
    list_res = client.get("/api/v1/tenants?search=acme")
    tenant_id = list_res.json()[0]["id"]

    response = client.get(f"/api/v1/tenants/{tenant_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == tenant_id
    assert "configuration" in data


def test_update_tenant_configuration_and_branding(client):
    list_res = client.get("/api/v1/tenants?search=acme")
    tenant_id = list_res.json()[0]["id"]

    config_payload = {
        "custom_domain": "portal.acme.com",
        "logo_url": "https://acme.com/logo.png",
        "primary_theme_color": "#0055FF",
        "saml_sso_config": "enabled=true;idp=https://idp.acme.com",
    }
    response = client.put(
        f"/api/v1/tenants/{tenant_id}/configuration", json=config_payload
    )
    assert response.status_code == 200
    data = response.json()
    assert data["custom_domain"] == "portal.acme.com"
    assert data["logo_url"] == "https://acme.com/logo.png"
    assert data["primary_theme_color"] == "#0055FF"


def test_update_tenant_config_invalid_domain(client):
    list_res = client.get("/api/v1/tenants?search=acme")
    tenant_id = list_res.json()[0]["id"]

    bad_config = {
        "custom_domain": "invalid domain with spaces",
    }
    response = client.put(f"/api/v1/tenants/{tenant_id}/configuration", json=bad_config)
    assert response.status_code in (400, 422)


def test_update_tenant_config_duplicate_domain(client):
    client.post(
        "/api/v1/tenants",
        json={
            "name": "Beta Corp",
            "slug": "beta-corp",
            "admin_email": "admin@beta.com",
        },
    )
    list_res = client.get("/api/v1/tenants?search=beta-corp")
    beta_id = list_res.json()[0]["id"]

    dup_config = {"custom_domain": "portal.acme.com"}
    response = client.put(f"/api/v1/tenants/{beta_id}/configuration", json=dup_config)
    assert response.status_code == 409
    assert "already in use" in response.json()["detail"]


def test_quota_management_user_seats_and_storage(client):
    create_res = client.post(
        "/api/v1/tenants",
        json={
            "name": "Quota Test Corp",
            "slug": "quota-corp",
            "admin_email": "admin@quota.com",
            "tier": "Free",
            "max_users": 2,
            "storage_limit_gb": 5,
        },
    )
    assert create_res.status_code == 201
    tenant_id = create_res.json()["id"]

    # Add user 1
    u1 = client.post(
        f"/api/v1/tenants/{tenant_id}/users",
        json={
            "email": "u1@quota.com",
            "password": "password123",
            "full_name": "User One",
        },
    )
    assert u1.status_code == 201

    # Add user 2
    u2 = client.post(
        f"/api/v1/tenants/{tenant_id}/users",
        json={
            "email": "u2@quota.com",
            "password": "password123",
            "full_name": "User Two",
        },
    )
    assert u2.status_code == 201

    # Add user 3 (should fail with 400 quota exhausted)
    u3 = client.post(
        f"/api/v1/tenants/{tenant_id}/users",
        json={
            "email": "u3@quota.com",
            "password": "password123",
            "full_name": "User Three",
        },
    )
    assert u3.status_code == 400
    assert "quota exhausted" in u3.json()["detail"].lower()

    # Telemetry endpoint check
    telem_res = client.get(f"/api/v1/tenants/{tenant_id}/telemetry")
    assert telem_res.status_code == 200
    telem_data = telem_res.json()
    assert telem_data["users"]["current"] == 2
    assert telem_data["users"]["max"] == 2

    # Storage quota check pass (3GB <= 5GB limit)
    st_pass = client.post(f"/api/v1/tenants/{tenant_id}/storage/check?requested_gb=3")
    assert st_pass.status_code == 200
    assert st_pass.json()["status"] == "allowed"

    # Storage quota check exceed (10GB > 5GB limit)
    st_fail = client.post(f"/api/v1/tenants/{tenant_id}/storage/check?requested_gb=10")
    assert st_fail.status_code == 400
    assert "quota exceeded" in st_fail.json()["detail"].lower()


def test_multi_tenant_data_isolation(client):
    create_res = client.post(
        "/api/v1/tenants",
        json={
            "name": "Isolation Test Corp",
            "slug": "iso-corp",
            "admin_email": "admin@iso.com",
            "tier": "Pro",
        },
    )
    assert create_res.status_code == 201
    tenant_id = create_res.json()["id"]

    # Add 2 users to iso-corp
    client.post(
        f"/api/v1/tenants/{tenant_id}/users",
        json={
            "email": "iso1@iso.com",
            "password": "password123",
            "full_name": "Iso One",
        },
    )
    client.post(
        f"/api/v1/tenants/{tenant_id}/users",
        json={
            "email": "iso2@iso.com",
            "password": "password123",
            "full_name": "Iso Two",
        },
    )

    # Getting users with matching header
    res_valid = client.get(
        f"/api/v1/tenants/{tenant_id}/users",
        headers={"X-Tenant-ID": tenant_id},
    )
    assert res_valid.status_code == 200
    assert len(res_valid.json()) == 2

    # Getting users with mismatched header
    res_invalid = client.get(
        f"/api/v1/tenants/{tenant_id}/users",
        headers={"X-Tenant-ID": "other-tenant-id"},
    )
    assert res_invalid.status_code == 403


def test_status_transition_and_archived_tenant_lock(client):
    list_res = client.get("/api/v1/tenants?search=beta-corp")
    beta_id = list_res.json()[0]["id"]

    # Transition status to Suspended
    patch_suspend = client.patch(
        f"/api/v1/tenants/{beta_id}/status",
        json={"status": "Suspended", "reason": "Non-payment"},
    )
    assert patch_suspend.status_code == 200
    assert patch_suspend.json()["status"] == "Suspended"

    # Accessing suspended tenant blocked
    res_users = client.get(f"/api/v1/tenants/{beta_id}/users")
    assert res_users.status_code == 403

    # Transition status to Archived
    patch_archive = client.patch(
        f"/api/v1/tenants/{beta_id}/status",
        json={"status": "Archived", "reason": "Decommissioned"},
    )
    assert patch_archive.status_code == 200
    assert patch_archive.json()["status"] == "Archived"

    res_update = client.put(
        f"/api/v1/tenants/{beta_id}",
        json={"name": "Beta Corp Updated"},
    )
    assert res_update.status_code == 422
    assert "Archived tenants cannot be modified" in res_update.json()["detail"]
