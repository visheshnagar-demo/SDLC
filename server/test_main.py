import pytest


def test_health_check(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}


def test_create_wire_auto_approve(client):
    payload = {
        "beneficiaryName": "Global Logistics Inc",
        "accountNumber": "987654321012",
        "routingNumber": "121000358",
        "amount": 5000.00
    }
    headers = {"X-User-ID": "User A (Maker)"}
    response = client.post("/api/wires", json=payload, headers=headers)
    assert response.status_code == 201
    data = response.json()
    assert data["beneficiaryName"] == "Global Logistics Inc"
    assert data["amount"] == 5000.00
    assert data["status"] == "APPROVED"
    assert data["createdBy"] == "User A (Maker)"
    assert data["approvedBy"] == "SYSTEM_AUTO"
    assert "id" in data


def test_create_wire_pending(client):
    payload = {
        "beneficiaryName": "ACME Industrial Corp",
        "accountNumber": "987654321012",
        "routingNumber": "121000358",
        "amount": 15000.00
    }
    headers = {"X-User-ID": "User A (Maker)"}
    response = client.post("/api/wires", json=payload, headers=headers)
    assert response.status_code == 201
    data = response.json()
    assert data["beneficiaryName"] == "ACME Industrial Corp"
    assert data["amount"] == 15000.00
    assert data["status"] == "PENDING"
    assert data["createdBy"] == "User A (Maker)"
    assert data["approvedBy"] is None
    assert "id" in data


def test_get_pending_wires(client):
    # Create pending wire
    payload = {
        "beneficiaryName": "Vertex Capital LLC",
        "accountNumber": "1122334455",
        "routingNumber": "021000021",
        "amount": 25000.00
    }
    client.post("/api/wires", json=payload, headers={"X-User-ID": "User A (Maker)"})

    response = client.get("/api/wires/pending")
    assert response.status_code == 200
    pending_list = response.json()
    assert isinstance(pending_list, list)
    assert len(pending_list) >= 1
    for wire in pending_list:
        assert wire["status"] == "PENDING"


def test_approve_wire_self_approval_forbidden_403(client):
    # Create pending wire as User A
    payload = {
        "beneficiaryName": "ACME Self Approval Test",
        "accountNumber": "1234567890",
        "routingNumber": "121000358",
        "amount": 20000.00
    }
    create_res = client.post("/api/wires", json=payload, headers={"X-User-ID": "User A (Maker)"})
    wire_id = create_res.json()["id"]

    # Attempt to approve as User A (same user)
    approve_res = client.put(f"/api/wires/{wire_id}/approve", headers={"X-User-ID": "User A (Maker)"})
    assert approve_res.status_code == 403
    assert "detail" in approve_res.json()
    assert "Maker cannot approve" in approve_res.json()["detail"]


def test_approve_wire_success_checker(client):
    # Create pending wire as User A
    payload = {
        "beneficiaryName": "Starlight Holdings",
        "accountNumber": "5566778899",
        "routingNumber": "121000358",
        "amount": 30000.00
    }
    create_res = client.post("/api/wires", json=payload, headers={"X-User-ID": "User A (Maker)"})
    wire_id = create_res.json()["id"]

    # Approve as User B (Checker)
    approve_res = client.put(f"/api/wires/{wire_id}/approve", headers={"X-User-ID": "User B (Checker)"})
    assert approve_res.status_code == 200
    data = approve_res.json()
    assert data["status"] == "APPROVED"
    assert data["approvedBy"] == "User B (Checker)"


def test_reject_wire_success(client):
    # Create pending wire as User A
    payload = {
        "beneficiaryName": "Rejected Corp",
        "accountNumber": "9988776655",
        "routingNumber": "121000358",
        "amount": 12000.00
    }
    create_res = client.post("/api/wires", json=payload, headers={"X-User-ID": "User A (Maker)"})
    wire_id = create_res.json()["id"]

    # Reject as User B (Checker)
    reject_res = client.put(f"/api/wires/{wire_id}/reject", headers={"X-User-ID": "User B (Checker)"})
    assert reject_res.status_code == 200
    data = reject_res.json()
    assert data["status"] == "REJECTED"
    assert data["approvedBy"] == "User B (Checker)"


def test_approve_non_pending_wire_400(client):
    # Create auto-approved wire
    payload = {
        "beneficiaryName": "Small Wire Corp",
        "accountNumber": "1111222233",
        "routingNumber": "121000358",
        "amount": 1000.00
    }
    create_res = client.post("/api/wires", json=payload, headers={"X-User-ID": "User A (Maker)"})
    wire_id = create_res.json()["id"]

    # Attempt to approve an already APPROVED wire
    approve_res = client.put(f"/api/wires/{wire_id}/approve", headers={"X-User-ID": "User B (Checker)"})
    assert approve_res.status_code == 400


def test_approve_non_existent_wire_404(client):
    response = client.put("/api/wires/non-existent-uuid/approve", headers={"X-User-ID": "User B (Checker)"})
    assert response.status_code == 404
