def test_health_check(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_create_wire_auto_approved(client):
    payload = {
        "beneficiaryName": "Acme Small Business",
        "accountNumber": "111222333",
        "routingNumber": "123456789",
        "amount": 5000.00,
        "createdBy": "User A (Maker)",
    }
    response = client.post("/api/wires", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["status"] == "APPROVED"
    assert data["beneficiaryName"] == "Acme Small Business"
    assert data["amount"] == 5000.00
    assert data["createdBy"] == "User A (Maker)"
    assert data["approvedBy"] == "User A (Maker)"


def test_create_wire_pending_dual_approval(client):
    payload = {
        "beneficiaryName": "Globex Enterprise",
        "accountNumber": "444555666",
        "routingNumber": "987654321",
        "amount": 15000.00,
        "createdBy": "User A (Maker)",
    }
    response = client.post("/api/wires", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["status"] == "PENDING"
    assert data["amount"] == 15000.00
    assert data["createdBy"] == "User A (Maker)"
    assert data["approvedBy"] is None


def test_boundary_threshold(client):
    # Exactly $10,000.00 -> auto-approved
    resp_exact = client.post(
        "/api/wires",
        json={
            "beneficiaryName": "Exact Threshold Corp",
            "accountNumber": "10000000",
            "routingNumber": "10000000",
            "amount": 10000.00,
            "createdBy": "User A (Maker)",
        },
    )
    assert resp_exact.status_code == 201
    assert resp_exact.json()["status"] == "APPROVED"

    # $10,000.01 -> PENDING
    resp_above = client.post(
        "/api/wires",
        json={
            "beneficiaryName": "Above Threshold Corp",
            "accountNumber": "10000001",
            "routingNumber": "10000001",
            "amount": 10000.01,
            "createdBy": "User A (Maker)",
        },
    )
    assert resp_above.status_code == 201
    assert resp_above.json()["status"] == "PENDING"


def test_get_pending_wires(client):
    # Create two pending wires and one auto-approved wire
    client.post(
        "/api/wires",
        json={
            "beneficiaryName": "Pending One",
            "accountNumber": "101",
            "routingNumber": "202",
            "amount": 20000.00,
            "createdBy": "User A (Maker)",
        },
    )
    client.post(
        "/api/wires",
        json={
            "beneficiaryName": "Pending Two",
            "accountNumber": "303",
            "routingNumber": "404",
            "amount": 30000.00,
            "createdBy": "User A (Maker)",
        },
    )
    client.post(
        "/api/wires",
        json={
            "beneficiaryName": "Auto Approved",
            "accountNumber": "505",
            "routingNumber": "606",
            "amount": 1000.00,
            "createdBy": "User A (Maker)",
        },
    )

    response = client.get("/api/wires/pending")
    assert response.status_code == 200
    pending_list = response.json()
    assert isinstance(pending_list, list)
    # Check all returned wires have status PENDING
    for wire in pending_list:
        assert wire["status"] == "PENDING"
    pending_names = [w["beneficiaryName"] for w in pending_list]
    assert "Pending One" in pending_names
    assert "Pending Two" in pending_names
    assert "Auto Approved" not in pending_names


def test_approve_wire_success(client):
    create_resp = client.post(
        "/api/wires",
        json={
            "beneficiaryName": "Wire To Approve",
            "accountNumber": "707",
            "routingNumber": "808",
            "amount": 50000.00,
            "createdBy": "User A (Maker)",
        },
    )
    wire_id = create_resp.json()["id"]

    approve_resp = client.put(
        f"/api/wires/{wire_id}/approve",
        json={"approvedBy": "User B (Checker)"},
    )
    assert approve_resp.status_code == 200
    data = approve_resp.json()
    assert data["status"] == "APPROVED"
    assert data["approvedBy"] == "User B (Checker)"


def test_approve_wire_self_approval_forbidden(client):
    create_resp = client.post(
        "/api/wires",
        json={
            "beneficiaryName": "Self Approval Test",
            "accountNumber": "909",
            "routingNumber": "909",
            "amount": 25000.00,
            "createdBy": "User A (Maker)",
        },
    )
    wire_id = create_resp.json()["id"]

    # User A tries to approve their own wire -> 403 Forbidden
    approve_resp = client.put(
        f"/api/wires/{wire_id}/approve",
        json={"approvedBy": "User A (Maker)"},
    )
    assert approve_resp.status_code == 403
    assert "Maker cannot approve" in approve_resp.json()["detail"]


def test_reject_wire_success(client):
    create_resp = client.post(
        "/api/wires",
        json={
            "beneficiaryName": "Wire To Reject",
            "accountNumber": "111",
            "routingNumber": "222",
            "amount": 12000.00,
            "createdBy": "User A (Maker)",
        },
    )
    wire_id = create_resp.json()["id"]

    reject_resp = client.put(
        f"/api/wires/{wire_id}/reject",
        json={"approvedBy": "User B (Checker)"},
    )
    assert reject_resp.status_code == 200
    data = reject_resp.json()
    assert data["status"] == "REJECTED"
    assert data["approvedBy"] == "User B (Checker)"


def test_approve_non_existent_wire(client):
    response = client.put(
        "/api/wires/non-existent-uuid/approve",
        json={"approvedBy": "User B (Checker)"},
    )
    assert response.status_code == 404
    assert response.json()["detail"] == "Wire transfer not found"


def test_approve_already_processed_wire(client):
    create_resp = client.post(
        "/api/wires",
        json={
            "beneficiaryName": "Already Approved",
            "accountNumber": "333",
            "routingNumber": "444",
            "amount": 5000.00,
            "createdBy": "User A (Maker)",
        },
    )
    wire_id = create_resp.json()["id"]

    # This wire was auto-approved because amount <= 10000
    response = client.put(
        f"/api/wires/{wire_id}/approve",
        json={"approvedBy": "User B (Checker)"},
    )
    assert response.status_code == 400
    assert "not in PENDING status" in response.json()["detail"]


def test_invalid_input_validation(client):
    # Negative amount -> 422
    resp_neg = client.post(
        "/api/wires",
        json={
            "beneficiaryName": "Invalid Amount",
            "accountNumber": "123",
            "routingNumber": "456",
            "amount": -500.00,
            "createdBy": "User A (Maker)",
        },
    )
    assert resp_neg.status_code == 422

    # Missing fields -> 422
    resp_missing = client.post(
        "/api/wires",
        json={
            "beneficiaryName": "Missing Fields",
            "amount": 1000.00,
        },
    )
    assert resp_missing.status_code == 422
