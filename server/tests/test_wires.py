def test_health_check(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_create_wire_auto_approve(client):
    # Amount <= 10000 should auto-approve
    payload = {
        "beneficiaryName": "Acme Logistics",
        "accountNumber": "123456789",
        "routingNumber": "987654321",
        "amount": 5000.00,
        "createdBy": "User A",
    }
    response = client.post("/api/wires", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["status"] == "APPROVED"
    assert data["beneficiaryName"] == "Acme Logistics"
    assert data["createdBy"] == "User A"
    assert data["approvedBy"] == "User A"
    assert "id" in data


def test_create_wire_pending(client):
    # Amount > 10000 should be set to PENDING
    payload = {
        "beneficiaryName": "Global Corp",
        "accountNumber": "987654321",
        "routingNumber": "123456789",
        "amount": 15000.00,
        "createdBy": "User A",
    }
    response = client.post("/api/wires", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["status"] == "PENDING"
    assert data["createdBy"] == "User A"
    assert data["approvedBy"] is None


def test_get_pending_wires(client):
    # Create a pending wire
    payload = {
        "beneficiaryName": "Pending Recipient",
        "accountNumber": "555555555",
        "routingNumber": "111111111",
        "amount": 25000.00,
        "createdBy": "User A",
    }
    client.post("/api/wires", json=payload)

    response = client.get("/api/wires/pending")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    assert any(w["beneficiaryName"] == "Pending Recipient" for w in data)
    assert all(w["status"] == "PENDING" for w in data)


def test_self_approval_forbidden(client):
    # Create pending wire as User A
    payload = {
        "beneficiaryName": "Self Approval Test",
        "accountNumber": "111222333",
        "routingNumber": "444555666",
        "amount": 50000.00,
        "createdBy": "User A",
    }
    create_res = client.post("/api/wires", json=payload)
    wire_id = create_res.json()["id"]

    # User A attempts to approve their own wire -> 403 Forbidden
    approve_res = client.put(
        f"/api/wires/{wire_id}/approve", json={"approvedBy": "User A"}
    )
    assert approve_res.status_code == 403
    assert "Segregation of Duties" in approve_res.json()["detail"]


def test_checker_approval_success(client):
    # Create pending wire as User A
    payload = {
        "beneficiaryName": "Checker Approval Test",
        "accountNumber": "111222333",
        "routingNumber": "444555666",
        "amount": 75000.00,
        "createdBy": "User A",
    }
    create_res = client.post("/api/wires", json=payload)
    wire_id = create_res.json()["id"]

    # User B (Checker) approves -> 200 OK
    approve_res = client.put(
        f"/api/wires/{wire_id}/approve", json={"approvedBy": "User B"}
    )
    assert approve_res.status_code == 200
    data = approve_res.json()
    assert data["status"] == "APPROVED"
    assert data["approvedBy"] == "User B"


def test_self_rejection_forbidden(client):
    # Create pending wire as User A
    payload = {
        "beneficiaryName": "Self Rejection Test",
        "accountNumber": "777888999",
        "routingNumber": "000111222",
        "amount": 30000.00,
        "createdBy": "User A",
    }
    create_res = client.post("/api/wires", json=payload)
    wire_id = create_res.json()["id"]

    # User A attempts to reject their own wire -> 403 Forbidden
    reject_res = client.put(
        f"/api/wires/{wire_id}/reject", json={"approvedBy": "User A"}
    )
    assert reject_res.status_code == 403


def test_checker_rejection_success(client):
    # Create pending wire as User A
    payload = {
        "beneficiaryName": "Checker Rejection Test",
        "accountNumber": "777888999",
        "routingNumber": "000111222",
        "amount": 35000.00,
        "createdBy": "User A",
    }
    create_res = client.post("/api/wires", json=payload)
    wire_id = create_res.json()["id"]

    # User B (Checker) rejects -> 200 OK
    reject_res = client.put(
        f"/api/wires/{wire_id}/reject", json={"approvedBy": "User B"}
    )
    assert reject_res.status_code == 200
    data = reject_res.json()
    assert data["status"] == "REJECTED"
    assert data["approvedBy"] == "User B"


def test_wire_not_found(client):
    res_approve = client.put(
        "/api/wires/non-existent-id/approve", json={"approvedBy": "User B"}
    )
    assert res_approve.status_code == 404

    res_reject = client.put(
        "/api/wires/non-existent-id/reject", json={"approvedBy": "User B"}
    )
    assert res_reject.status_code == 404
