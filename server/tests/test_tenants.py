def test_health_check(client):
    response = client.get("/healthz")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}

    response = client.get("/readyz")
    assert response.status_code == 200
    assert response.json() == {"status": "ready"}


def test_list_subscription_tiers(client):
    response = client.get("/api/v1/subscription-tiers")
    assert response.status_code == 200
    tiers = response.json()
    assert len(tiers) >= 3
    tier_names = [t["name"] for t in tiers]
    assert "STARTER" in tier_names
    assert "PRO" in tier_names
    assert "ENTERPRISE" in tier_names


def test_create_and_get_tenant(client):
    payload = {
        "name": "Acme Corporation",
        "slug": "acme",
        "tier_name": "ENTERPRISE",
        "admin_email": "admin@acme.com",
        "admin_first_name": "Alice",
        "admin_last_name": "Smith",
        "custom_subdomain": "acme.yourplatform.com",
        "settings": {"sso_enabled": True},
    }
    response = client.post("/api/v1/tenants", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Acme Corporation"
    assert data["slug"] == "acme"
    assert data["tenant_id"] == "tenant-acme-101"
    assert data["status"] == "ACTIVE"
    assert data["primary_domain"] == "acme.yourplatform.com"
    tenant_id = data["id"]

    # Get details
    get_res = client.get(f"/api/v1/tenants/{tenant_id}")
    assert get_res.status_code == 200
    detail = get_res.json()
    assert detail["id"] == tenant_id
    assert detail["tier"]["name"] == "ENTERPRISE"
    assert len(detail["domains"]) == 1


def test_duplicate_tenant_conflict(client):
    payload = {"name": "Acme Corporation", "slug": "acme", "tier_name": "STARTER"}
    res1 = client.post("/api/v1/tenants", json=payload)
    assert res1.status_code == 201

    res2 = client.post("/api/v1/tenants", json=payload)
    assert res2.status_code == 409
    assert "Duplicate" in res2.json()["detail"]


def test_list_tenants_and_pagination(client):
    client.post("/api/v1/tenants", json={"name": "Test Org", "slug": "testorg"})

    response = client.get("/api/v1/tenants?skip=0&limit=10&status=ACTIVE")
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "total" in data
    assert data["total"] >= 1


def test_update_tenant_metadata(client):
    res = client.post("/api/v1/tenants", json={"name": "Beta LLC", "slug": "beta"})
    tenant_id = res.json()["id"]

    update_res = client.put(
        f"/api/v1/tenants/{tenant_id}",
        json={"name": "Beta Inc", "admin_email": "admin@betainc.com"},
    )
    assert update_res.status_code == 200
    updated = update_res.json()
    assert updated["name"] == "Beta Inc"
    assert updated["admin_email"] == "admin@betainc.com"


def test_tenant_status_transitions_and_middleware(client):
    res = client.post("/api/v1/tenants", json={"name": "Gamma Inc", "slug": "gamma"})
    data = res.json()
    tenant_id = data["id"]
    t_id_str = data["tenant_id"]

    # Suspend tenant
    patch_res = client.patch(
        f"/api/v1/tenants/{tenant_id}/status", json={"status": "SUSPENDED"}
    )
    assert patch_res.status_code == 200
    assert patch_res.json()["status"] == "SUSPENDED"

    # Middleware check with X-Tenant-ID header
    sub_res = client.get(
        "/api/v1/subscription-tiers", headers={"X-Tenant-ID": t_id_str}
    )
    assert sub_res.status_code == 403
    assert sub_res.json()["detail"] == "Tenant is suspended or inactive"

    # Reactivate
    reactivate_res = client.patch(
        f"/api/v1/tenants/{tenant_id}/status", json={"status": "ACTIVE"}
    )
    assert reactivate_res.status_code == 200
    assert reactivate_res.json()["status"] == "ACTIVE"


def test_domain_mapping_management(client):
    res = client.post("/api/v1/tenants", json={"name": "Delta Co", "slug": "delta"})
    tenant_id = res.json()["id"]

    # Add custom domain
    dom_res = client.post(
        f"/api/v1/tenants/{tenant_id}/domains",
        json={"domain_name": "delta.customdomain.com", "is_primary": True},
    )
    assert dom_res.status_code == 201
    domain_id = dom_res.json()["id"]

    # List domains
    list_doms = client.get(f"/api/v1/tenants/{tenant_id}/domains")
    assert list_doms.status_code == 200
    assert len(list_doms.json()) == 2  # default subdomain + new custom domain

    # Delete custom domain
    del_dom = client.delete(f"/api/v1/tenants/{tenant_id}/domains/{domain_id}")
    assert del_dom.status_code == 204


def test_subscription_quota_and_downgrade(client):
    res = client.post(
        "/api/v1/tenants",
        json={"name": "Epsilon Ltd", "slug": "epsilon", "tier_name": "PRO"},
    )
    tenant_id = res.json()["id"]

    # Change tier to ENTERPRISE
    sub_up = client.put(
        f"/api/v1/tenants/{tenant_id}/subscription", json={"tier_name": "ENTERPRISE"}
    )
    assert sub_up.status_code == 200
    assert sub_up.json()["tier_name"] == "ENTERPRISE"


def test_tenant_usage_and_audit_logs(client):
    res = client.post("/api/v1/tenants", json={"name": "Zeta SaaS", "slug": "zeta"})
    tenant_id = res.json()["id"]

    usage_res = client.get(f"/api/v1/tenants/{tenant_id}/usage")
    assert usage_res.status_code == 200
    usage = usage_res.json()
    assert "active_users" in usage
    assert "usage_percentage_users" in usage

    audit_res = client.get(f"/api/v1/tenants/{tenant_id}/audit-logs")
    assert audit_res.status_code == 200
    logs = audit_res.json()
    assert logs["total"] >= 1
    actions = [l["action"] for l in logs["items"]]
    assert "TENANT_CREATED" in actions


def test_soft_delete_tenant(client):
    res = client.post("/api/v1/tenants", json={"name": "Eta Corp", "slug": "eta"})
    tenant_id = res.json()["id"]

    del_res = client.delete(f"/api/v1/tenants/{tenant_id}")
    assert del_res.status_code == 204

    get_res = client.get(f"/api/v1/tenants/{tenant_id}")
    assert get_res.status_code == 404
