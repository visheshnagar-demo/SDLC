def test_health_check(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


def test_create_wire_auto_approve(client):
    payload = {
        "beneficiaryName": "Bob Corp",
        "accountNumber": "987654321",
        "routingNumber": "123456789",
        "amount": 5000.00,
    }
    headers = {"X-User-Id": "User A"}
    response = client.post("/api/wires", json=payload, headers=headers)
    assert response.status_code == 201
    data = response.json()
    assert data["beneficiaryName"] == "Bob Corp"
    assert data["amount"] == 5000.00
    assert data["status"] == "APPROVED"
    assert data["createdBy"] == "User A"


def test_create_wire_pending(client):
    payload = {
        "beneficiaryName": "Acme Industrial Corp",
        "accountNumber": "1234567890",
        "routingNumber": "021000021",
        "amount": 15000.00,
    }
    headers = {"X-User-Id": "User A"}
    response = client.post("/api/wires", json=payload, headers=headers)
    assert response.status_code == 201
    data = response.json()
    assert data["beneficiaryName"] == "Acme Industrial Corp"
    assert data["amount"] == 15000.00
    assert data["status"] == "PENDING"
    assert data["createdBy"] == "User A"
    assert data["approvedBy"] is None


def test_get_pending_wires(client):
    # Create a pending wire
    payload = {
        "beneficiaryName": "High Value Beneficiary",
        "accountNumber": "111222333",
        "routingNumber": "444555666",
        "amount": 25000.00,
    }
    client.post("/api/wires", json=payload, headers={"X-User-Id": "User A"})

    response = client.get("/api/wires/pending")
    assert response.status_code == 200
    wires = response.json()
    assert len(wires) >= 1
    assert all(w["status"] == "PENDING" for w in wires)


def test_approve_wire_same_user_forbidden(client):
    # User A creates a pending wire
    payload = {
        "beneficiaryName": "Self Approval Test",
        "accountNumber": "555666777",
        "routingNumber": "888999000",
        "amount": 20000.00,
    }
    create_res = client.post("/api/wires", json=payload, headers={"X-User-Id": "User A"})
    wire_id = create_res.json()["id"]

    # User A tries to approve their own wire -> 403 Forbidden
    approve_res = client.put(f"/api/wires/{wire_id}/approve", headers={"X-User-Id": "User A"})
    assert approve_res.status_code == 403
    assert "Maker cannot approve" in approve_res.json()["detail"]


def test_approve_wire_success(client):
    # User A creates a pending wire
    payload = {
        "beneficiaryName": "Valid Checker Test",
        "accountNumber": "111111111",
        "routingNumber": "222222222",
        "amount": 30000.00,
    }
    create_res = client.post("/api/wires", json=payload, headers={"X-User-Id": "User A"})
    wire_id = create_res.json()["id"]

    # User B approves the wire -> 200 OK
    approve_res = client.put(f"/api/wires/{wire_id}/approve", headers={"X-User-Id": "User B"})
    assert approve_res.status_code == 200
    data = approve_res.json()
    assert data["status"] == "APPROVED"
    assert data["approvedBy"] == "User B"


def test_reject_wire_success(client):
    # User A creates a pending wire
    payload = {
        "beneficiaryName": "Rejection Test Corp",
        "accountNumber": "333333333",
        "routingNumber": "444444444",
        "amount": 40000.00,
    }
    create_res = client.post("/api/wires", json=payload, headers={"X-User-Id": "User A"})
    wire_id = create_res.json()["id"]

    # User B rejects the wire -> 200 OK
    reject_res = client.put(f"/api/wires/{wire_id}/reject", headers={"X-User-Id": "User B"})
    assert reject_res.status_code == 200
    data = reject_res.json()
    assert data["status"] == "REJECTED"
    assert data["approvedBy"] == "User B"


def test_approve_already_processed_wire_bad_request(client):
    # User A creates a wire <= $10k (auto-approved)
    payload = {
        "beneficiaryName": "Small Transfer",
        "accountNumber": "123123123",
        "routingNumber": "987987987",
        "amount": 1000.00,
    }
    create_res = client.post("/api/wires", json=payload, headers={"X-User-Id": "User A"})
    wire_id = create_res.json()["id"]

    # Try to approve already APPROVED wire -> 400 Bad Request
    approve_res = client.put(f"/api/wires/{wire_id}/approve", headers={"X-User-Id": "User B"})
    assert approve_res.status_code == 400


def test_wire_not_found(client):
    res = client.get("/api/wires/non-existent-uuid")
    assert res.status_code == 404

    res_approve = client.put("/api/wires/non-existent-uuid/approve", headers={"X-User-Id": "User B"})
    assert res_approve.status_code == 404
