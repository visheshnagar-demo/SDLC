from datetime import datetime, timedelta, timezone

from server.database import get_password_hash
from server.models import User


def test_get_pending_approvals(client, host_user, host_headers):
    # Create a visit request
    start_time = (datetime.now(timezone.utc) + timedelta(hours=3)).isoformat()
    client.post(
        "/api/v1/visitors/register",
        json={
            "full_name": "Bob Builder",
            "email": "bob@builder.com",
            "phone": "555-2233",
            "company": "Bob Construction",
            "purpose": "Site Inspection",
            "scheduled_start_time": start_time,
            "host_id": host_user.id,
        },
    )

    response = client.get("/api/v1/approvals/pending", headers=host_headers)
    assert response.status_code == 200
    data = response.json()
    items = data if isinstance(data, list) else data.get("items", [])
    assert len(items) >= 1
    assert any(item["visitor"]["email"] == "bob@builder.com" for item in items)


def test_approve_visit_success(client, host_user, host_headers):
    start_time = (datetime.now(timezone.utc) + timedelta(hours=3)).isoformat()
    reg_resp = client.post(
        "/api/v1/visitors/register",
        json={
            "full_name": "Charlie Chaplin",
            "email": "charlie@comedy.com",
            "phone": "555-9988",
            "purpose": "Filming Interview",
            "scheduled_start_time": start_time,
            "host_id": host_user.id,
        },
    )
    visit_id = reg_resp.json()["id"]

    # Approve
    action_resp = client.post(
        f"/api/v1/approvals/{visit_id}/action",
        json={"action": "APPROVE", "approval_notes": "Welcome Charlie!"},
        headers=host_headers,
    )
    assert action_resp.status_code == 200
    data = action_resp.json()
    assert data["status"] == "APPROVED"
    assert data["pass_code"] is not None
    assert data["pass_code"].startswith("VP-")
    assert data["approval_notes"] == "Welcome Charlie!"
    assert data["approved_at"] is not None


def test_reject_visit_success(client, host_user, host_headers):
    start_time = (datetime.now(timezone.utc) + timedelta(hours=3)).isoformat()
    reg_resp = client.post(
        "/api/v1/visitors/register",
        json={
            "full_name": "Dave Reject",
            "email": "dave@reject.com",
            "phone": "555-7766",
            "purpose": "Unsolicited Pitch",
            "scheduled_start_time": start_time,
            "host_id": host_user.id,
        },
    )
    visit_id = reg_resp.json()["id"]

    action_resp = client.post(
        f"/api/v1/approvals/{visit_id}/action",
        json={"action": "REJECT", "approval_notes": "No solicitation policy"},
        headers=host_headers,
    )
    assert action_resp.status_code == 200
    data = action_resp.json()
    assert data["status"] == "REJECTED"
    assert data["pass_code"] is None
    assert data["approval_notes"] == "No solicitation policy"


def test_host_cannot_approve_other_host_visit(client, db_session, host_headers):
    # Create another host
    other_host = User(
        email="other.host@example.com",
        full_name="Other Host",
        role="HOST",
        hashed_password=get_password_hash("password123"),
        is_active=True,
    )
    db_session.add(other_host)
    db_session.commit()

    start_time = (datetime.now(timezone.utc) + timedelta(hours=3)).isoformat()
    reg_resp = client.post(
        "/api/v1/visitors/register",
        json={
            "full_name": "Eve Visitor",
            "email": "eve@target.com",
            "phone": "555-4321",
            "purpose": "Meeting Other Host",
            "scheduled_start_time": start_time,
            "host_id": other_host.id,
        },
    )
    visit_id = reg_resp.json()["id"]

    # Try to approve with first host_user credentials
    action_resp = client.post(
        f"/api/v1/approvals/{visit_id}/action",
        json={"action": "APPROVE"},
        headers=host_headers,
    )
    assert action_resp.status_code == 403


def test_admin_can_approve_any_visit(client, db_session, admin_headers):
    other_host = User(
        email="another.host@example.com",
        full_name="Another Host",
        role="HOST",
        hashed_password=get_password_hash("password123"),
        is_active=True,
    )
    db_session.add(other_host)
    db_session.commit()

    start_time = (datetime.now(timezone.utc) + timedelta(hours=3)).isoformat()
    reg_resp = client.post(
        "/api/v1/visitors/register",
        json={
            "full_name": "Frank AdminTest",
            "email": "frank@admintest.com",
            "phone": "555-9911",
            "purpose": "Audit",
            "scheduled_start_time": start_time,
            "host_id": other_host.id,
        },
    )
    visit_id = reg_resp.json()["id"]

    action_resp = client.post(
        f"/api/v1/approvals/{visit_id}/action",
        json={"action": "APPROVE", "approval_notes": "Approved by Admin override"},
        headers=admin_headers,
    )
    assert action_resp.status_code == 200
    assert action_resp.json()["status"] == "APPROVED"
