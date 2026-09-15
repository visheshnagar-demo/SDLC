def test_get_tenant_audit_logs(client):
    res = client.get("/api/v1/tenants/acme-corp")
    tenant_id = res.json()["id"]

    # Trigger an action to generate an audit log
    client.patch(f"/api/v1/tenants/{tenant_id}/status", json={"status": "Active"})

    audit_res = client.get(f"/api/v1/tenants/{tenant_id}/audit-logs")
    assert audit_res.status_code == 200
    data = audit_res.json()
    assert "items" in data
    assert "total" in data
    assert data["total"] >= 1
    assert data["items"][0]["tenant_id"] == tenant_id
