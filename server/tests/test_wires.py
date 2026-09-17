def test_health_check(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_create_wire_above_threshold_sets_pending(client):
    payload = {
        "beneficiaryName": "Global Corp USA",
        "accountNumber": "9876543210",
        "routingNumber": "123456789",
        "amount": 15000.00,
    }
    headers = {"X-User-Id": "User A"}
    response = client.post("/api/wires", json=payload, headers=headers)
    assert response.status_code == 201
    data = response.json()
    assert data["amount"] == 15000.00
    assert data["status"] == "PENDING"
    assert data["createdBy"] == "User A"
    assert data["approvedBy"] is None
    assert "id" in data


def test_create_wire_below_threshold_auto_approves(client):
    payload = {
        "beneficiaryName": "Local Business Inc",
        "accountNumber": "1122334455",
        "routingNumber": "987654321",
        "amount": 5000.00,
    }
    headers = {"X-User-Id": "User A"}
    response = client.post("/api/wires", json=payload, headers=headers)
    assert response.status_code == 201
    data = response.json()
    assert data["amount"] == 5000.00
    assert data["status"] == "APPROVED"
    assert data["createdBy"] == "User A"
    assert data["approvedBy"] == "System"


def test_get_pending_wires_queue(client):
    # Create a pending wire
    payload = {
        "beneficiaryName": "Acme Holdings",
        "accountNumber": "5544332211",
        "routingNumber": "112233445",
        "amount": 25000.00,
    }
    client.post("/api/wires", json=payload, headers={"X-User-Id": "User A"})

    response = client.get("/api/wires/pending")
    assert response.status_code == 200
    wires = response.json()
    assert isinstance(wires, list)
    assert len(wires) >= 1
    for wire in wires:
        assert wire["status"] == "PENDING"


def test_same_user_approval_returns_403_forbidden(client):
    # Maker creates high-value wire transfer
    payload = {
        "beneficiaryName": "Suspect Corp",
        "accountNumber": "1231231234",
        "routingNumber": "123456789",
        "amount": 30000.00,
    }
    create_res = client.post(
        "/api/wires", json=payload, headers={"X-User-Id": "User A"}
    )
    assert create_res.status_code == 201
    wire_id = create_res.json()["id"]

    # Maker attempts to approve their own wire transfer
    approve_res = client.put(
        f"/api/wires/{wire_id}/approve", headers={"X-User-Id": "User A"}
    )
    assert approve_res.status_code == 403
    assert "Maker cannot approve" in approve_res.json()["detail"]

    # Verify status is still PENDING
    get_res = client.get(f"/api/wires/{wire_id}")
    assert get_res.status_code == 200
    assert get_res.json()["status"] == "PENDING"


def test_different_user_checker_approval_succeeds(client):
    # Maker creates high-value wire transfer
    payload = {
        "beneficiaryName": "Valid Vendor LLC",
        "accountNumber": "7778889990",
        "routingNumber": "987654321",
        "amount": 40000.00,
    }
    create_res = client.post(
        "/api/wires", json=payload, headers={"X-User-Id": "User A"}
    )
    assert create_res.status_code == 201
    wire_id = create_res.json()["id"]

    # Checker (User B) approves
    approve_res = client.put(
        f"/api/wires/{wire_id}/approve", headers={"X-User-Id": "User B"}
    )
    assert approve_res.status_code == 200
    data = approve_res.json()
    assert data["status"] == "APPROVED"
    assert data["approvedBy"] == "User B"


def test_checker_rejection_succeeds(client):
    # Maker creates high-value wire transfer
    payload = {
        "beneficiaryName": "Unverified Supplier",
        "accountNumber": "0001112223",
        "routingNumber": "112233445",
        "amount": 50000.00,
    }
    create_res = client.post(
        "/api/wires", json=payload, headers={"X-User-Id": "User A"}
    )
    assert create_res.status_code == 201
    wire_id = create_res.json()["id"]

    # Checker (User B) rejects
    reject_res = client.put(
        f"/api/wires/{wire_id}/reject", headers={"X-User-Id": "User B"}
    )
    assert reject_res.status_code == 200
    data = reject_res.json()
    assert data["status"] == "REJECTED"
    assert data["approvedBy"] == "User B"


def test_approve_non_existent_wire_returns_404(client):
    response = client.put(
        "/api/wires/non-existent-id/approve", headers={"X-User-Id": "User B"}
    )
    assert response.status_code == 404


def test_metrics_endpoint(client):
    response = client.get("/api/wires/metrics")
    assert response.status_code == 200
    metrics = response.json()
    assert "totalVolume" in metrics
    assert "pendingCount" in metrics
    assert "autoApprovedCount" in metrics
    assert "approvedCount" in metrics
    assert "rejectedCount" in metrics
