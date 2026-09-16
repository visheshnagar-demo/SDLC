def test_health_check(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_create_wire_auto_approve(client):
    payload = {
        "beneficiaryName": "Small Business LLC",
        "accountNumber": "9876543210",
        "routingNumber": "123456789",
        "amount": 5000.00,
        "createdBy": "User A (Maker)",
    }
    response = client.post("/api/wires", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["status"] == "APPROVED"
    assert data["amount"] == 5000.00
    assert data["beneficiaryName"] == "Small Business LLC"
    assert data["createdBy"] == "User A (Maker)"
    assert data["approvedBy"] == "SYSTEM"


def test_create_wire_pending(client):
    payload = {
        "beneficiaryName": "Acme Industrial Corp",
        "accountNumber": "1234567890",
        "routingNumber": "987654321",
        "amount": 15000.00,
        "createdBy": "User A (Maker)",
    }
    response = client.post("/api/wires", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["status"] == "PENDING"
    assert data["amount"] == 15000.00
    assert data["approvedBy"] is None


def test_get_pending_wires(client):
    # Create a pending wire
    payload = {
        "beneficiaryName": "Global Trading Co",
        "accountNumber": "555666777",
        "routingNumber": "111222333",
        "amount": 25000.00,
        "createdBy": "User A (Maker)",
    }
    create_res = client.post("/api/wires", json=payload)
    assert create_res.status_code == 201
    wire_id = create_res.json()["id"]

    pending_res = client.get("/api/wires/pending")
    assert pending_res.status_code == 200
    pending_list = pending_res.json()
    assert any(w["id"] == wire_id for w in pending_list)


def test_approve_wire_success(client):
    # Create wire by User A
    payload = {
        "beneficiaryName": "Vendor Inc",
        "accountNumber": "444333222",
        "routingNumber": "888777666",
        "amount": 12000.00,
        "createdBy": "User A (Maker)",
    }
    create_res = client.post("/api/wires", json=payload)
    wire_id = create_res.json()["id"]

    # User B approves
    approve_res = client.put(
        f"/api/wires/{wire_id}/approve", json={"approvedBy": "User B (Checker)"}
    )
    assert approve_res.status_code == 200
    data = approve_res.json()
    assert data["status"] == "APPROVED"
    assert data["approvedBy"] == "User B (Checker)"


def test_approve_own_wire_forbidden(client):
    # Create wire by User A
    payload = {
        "beneficiaryName": "Self Transfer Corp",
        "accountNumber": "111111111",
        "routingNumber": "222222222",
        "amount": 50000.00,
        "createdBy": "User A (Maker)",
    }
    create_res = client.post("/api/wires", json=payload)
    wire_id = create_res.json()["id"]

    # User A tries to approve their own wire -> 403 Forbidden
    approve_res = client.put(
        f"/api/wires/{wire_id}/approve", json={"approvedBy": "User A (Maker)"}
    )
    assert approve_res.status_code == 403
    assert "Maker cannot approve their own wire transfer" in approve_res.json()["detail"]


def test_reject_wire_success(client):
    # Create wire by User A
    payload = {
        "beneficiaryName": "Suspicious Entity",
        "accountNumber": "999999999",
        "routingNumber": "000000000",
        "amount": 100000.00,
        "createdBy": "User A (Maker)",
    }
    create_res = client.post("/api/wires", json=payload)
    wire_id = create_res.json()["id"]

    # User B rejects
    reject_res = client.put(
        f"/api/wires/{wire_id}/reject", json={"approvedBy": "User B (Checker)"}
    )
    assert reject_res.status_code == 200
    data = reject_res.json()
    assert data["status"] == "REJECTED"
    assert data["approvedBy"] == "User B (Checker)"


def test_approve_wire_not_found(client):
    response = client.put(
        "/api/wires/non-existent-id/approve", json={"approvedBy": "User B (Checker)"}
    )
    assert response.status_code == 404
