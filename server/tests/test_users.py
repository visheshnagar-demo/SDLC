def test_list_tenant_users(client):
    res = client.get("/api/v1/tenants/acme-corp")
    tenant_id = res.json()["id"]

    users_res = client.get(f"/api/v1/tenants/{tenant_id}/users")
    assert users_res.status_code == 200
    data = users_res.json()
    assert "items" in data
    assert data["total"] >= 1


def test_invite_user_to_tenant(client):
    res = client.get("/api/v1/tenants/acme-corp")
    tenant_id = res.json()["id"]

    payload = {
        "email": "newmember@acme.com",
        "full_name": "New Member",
        "role": "Tenant Admin",
    }
    invite_res = client.post(f"/api/v1/tenants/{tenant_id}/users", json=payload)
    assert invite_res.status_code == 201
    data = invite_res.json()
    assert data["email"] == "newmember@acme.com"
    assert data["role"] == "Tenant Admin"


def test_invite_duplicate_user_conflict(client):
    res = client.get("/api/v1/tenants/acme-corp")
    tenant_id = res.json()["id"]

    # Try inviting admin@example.com who is already in acme-corp
    payload = {"email": "admin@example.com", "full_name": "Admin User", "role": "User"}
    dup_res = client.post(f"/api/v1/tenants/{tenant_id}/users", json=payload)
    assert dup_res.status_code == 409
    assert "already a member" in dup_res.json()["detail"]


def test_revoke_user_from_tenant(client):
    res = client.get("/api/v1/tenants/acme-corp")
    tenant_id = res.json()["id"]

    # First invite a user to revoke
    payload = {"email": "tempuser@acme.com", "full_name": "Temp User", "role": "Viewer"}
    inv_res = client.post(f"/api/v1/tenants/{tenant_id}/users", json=payload)
    user_id = inv_res.json()["user_id"]

    # Revoke user
    del_res = client.delete(f"/api/v1/tenants/{tenant_id}/users/{user_id}")
    assert del_res.status_code == 200

    # Verify user no longer in tenant
    list_res = client.get(f"/api/v1/tenants/{tenant_id}/users")
    emails = [u["email"] for u in list_res.json()["items"]]
    assert "tempuser@acme.com" not in emails
