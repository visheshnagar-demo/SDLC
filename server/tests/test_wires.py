def test_health_check(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_create_wire_auto_approved(client):
    payload = {
        "beneficiaryName": "Small Business LLC",
        "accountNumber": "987654321",
        "routingNumber": "121000358",
        "amount": 5000.00,
        "createdBy": "User A (Maker)",
    }
    response = client.post("/api/wires", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["status"] == "APPROVED"
    assert data["amount"] == 5000.00
    assert data["beneficiaryName"] == "Small Business LLC"
    assert "id" in data


def test_create_wire_exact_10k_auto_approved(client):
    payload = {
        "beneficiaryName": "Mid Corp",
        "accountNumber": "1122334455",
        "routingNumber": "121000358",
        "amount": 10000.00,
        "createdBy": "User A (Maker)",
    }
    response = client.post("/api/wires", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["status"] == "APPROVED"


def test_create_wire_pending(client):
    payload = {
        "beneficiaryName": "Acme Industrial Corp",
        "accountNumber": "1234567890",
        "routingNumber": "121000358",
        "amount": 15000.00,
        "createdBy": "User A (Maker)",
    }
    response = client.post("/api/wires", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["status"] == "PENDING"
    assert data["approvedBy"] is None


def test_create_wire_invalid_input(client):
    payload = {
        "beneficiaryName": "Invalid Corp",
        "accountNumber": "12345",
        "routingNumber": "121000358",
        "amount": -500.00,
        "createdBy": "User A (Maker)",
    }
    response = client.post("/api/wires", json=payload)
    assert response.status_code == 422


def test_get_pending_wires(client):
    # Create one pending wire and one auto-approved wire
    p1 = {
        "beneficiaryName": "Pending Wire 1",
        "accountNumber": "11111",
        "routingNumber": "121000358",
        "amount": 25000.00,
        "createdBy": "User A (Maker)",
    }
    p2 = {
        "beneficiaryName": "Auto Approved Wire",
        "accountNumber": "22222",
        "routingNumber": "121000358",
        "amount": 1000.00,
        "createdBy": "User A (Maker)",
    }
    client.post("/api/wires", json=p1)
    client.post("/api/wires", json=p2)

    response = client.get("/api/wires/pending")
    assert response.status_code == 200
    pending_list = response.json()
    assert isinstance(pending_list, list)
    for wire in pending_list:
        assert wire["status"] == "PENDING"
    assert any(w["beneficiaryName"] == "Pending Wire 1" for w in pending_list)
    assert not any(w["beneficiaryName"] == "Auto Approved Wire" for w in pending_list)


def test_approve_wire_success(client):
    # User A creates a pending wire
    create_payload = {
        "beneficiaryName": "Acme Big Corp",
        "accountNumber": "33333",
        "routingNumber": "121000358",
        "amount": 50000.00,
        "createdBy": "User A (Maker)",
    }
    created = client.post("/api/wires", json=create_payload).json()
    wire_id = created["id"]

    # User B approves the wire
    approve_payload = {"approvedBy": "User B (Checker)"}
    response = client.put(f"/api/wires/{wire_id}/approve", json=approve_payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "APPROVED"
    assert data["approvedBy"] == "User B (Checker)"


def test_approve_wire_self_approval_forbidden(client):
    # User A creates a pending wire
    create_payload = {
        "beneficiaryName": "Acme Fraud Corp",
        "accountNumber": "44444",
        "routingNumber": "121000358",
        "amount": 100000.00,
        "createdBy": "User A (Maker)",
    }
    created = client.post("/api/wires", json=create_payload).json()
    wire_id = created["id"]

    # User A attempts to approve their own wire -> 403 Forbidden
    approve_payload = {"approvedBy": "User A (Maker)"}
    response = client.put(f"/api/wires/{wire_id}/approve", json=approve_payload)
    assert response.status_code == 403
    assert "Maker cannot approve their own wire transfer" in response.json()["detail"]


def test_approve_wire_already_processed(client):
    # Create auto-approved wire (< $10,000)
    create_payload = {
        "beneficiaryName": "Small Wire",
        "accountNumber": "55555",
        "routingNumber": "121000358",
        "amount": 2000.00,
        "createdBy": "User A (Maker)",
    }
    created = client.post("/api/wires", json=create_payload).json()
    wire_id = created["id"]

    # Attempting to approve an already approved wire -> 400 Bad Request
    approve_payload = {"approvedBy": "User B (Checker)"}
    response = client.put(f"/api/wires/{wire_id}/approve", json=approve_payload)
    assert response.status_code == 400


def test_reject_wire_success(client):
    create_payload = {
        "beneficiaryName": "Risky Corp",
        "accountNumber": "66666",
        "routingNumber": "121000358",
        "amount": 75000.00,
        "createdBy": "User A (Maker)",
    }
    created = client.post("/api/wires", json=create_payload).json()
    wire_id = created["id"]

    reject_payload = {"approvedBy": "User B (Checker)"}
    response = client.put(f"/api/wires/{wire_id}/reject", json=reject_payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "REJECTED"
    assert data["approvedBy"] == "User B (Checker)"


def test_reject_wire_already_processed(client):
    create_payload = {
        "beneficiaryName": "Already Rejected",
        "accountNumber": "77777",
        "routingNumber": "121000358",
        "amount": 20000.00,
        "createdBy": "User A (Maker)",
    }
    created = client.post("/api/wires", json=create_payload).json()
    wire_id = created["id"]

    # Reject first time
    client.put(f"/api/wires/{wire_id}/reject", json={"approvedBy": "User B (Checker)"})

    # Reject second time -> 400 Bad Request
    response = client.put(
        f"/api/wires/{wire_id}/reject", json={"approvedBy": "User B (Checker)"}
    )
    assert response.status_code == 400


def test_wire_not_found(client):
    fake_id = "00000000-0000-0000-0000-000000000000"
    payload = {"approvedBy": "User B (Checker)"}
    res1 = client.put(f"/api/wires/{fake_id}/approve", json=payload)
    assert res1.status_code == 404

    res2 = client.put(f"/api/wires/{fake_id}/reject", json=payload)
    assert res2.status_code == 404
