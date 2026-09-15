def test_get_tenant_config(client):
    res = client.get("/api/v1/tenants/acme-corp")
    tenant_id = res.json()["id"]

    cfg_res = client.get(f"/api/v1/tenants/{tenant_id}/config")
    assert cfg_res.status_code == 200
    data = cfg_res.json()
    assert data["tenant_id"] == tenant_id
    assert "rate_limit_rpm" in data
    assert "storage_quota_gb" in data
    assert "feature_flags" in data


def test_update_tenant_config(client):
    res = client.get("/api/v1/tenants/acme-corp")
    tenant_id = res.json()["id"]

    update_payload = {
        "rate_limit_rpm": 2500,
        "storage_quota_gb": 150,
        "feature_flags": {"advanced_analytics": True, "beta_dashboard": True},
    }
    put_res = client.put(f"/api/v1/tenants/{tenant_id}/config", json=update_payload)
    assert put_res.status_code == 200
    data = put_res.json()
    assert data["rate_limit_rpm"] == 2500
    assert data["storage_quota_gb"] == 150
    assert data["feature_flags"]["beta_dashboard"] is True
