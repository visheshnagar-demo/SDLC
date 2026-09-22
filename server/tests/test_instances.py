"""Cloud Instance Lifecycle & Telemetry unit tests."""


def test_list_instances_dashboard(client, user_headers):
    # AC: Cloud Resource Dashboard - Displays active cloud VM instances
    response = client.get("/api/v1/instances", headers=user_headers)
    assert response.status_code == 200
    instances = response.json()
    assert isinstance(instances, list)
    assert len(instances) >= 3
    names = [inst["name"] for inst in instances]
    assert "web-server-01" in names


def test_filter_instances_by_status(client, user_headers):
    # AC: Cloud Resource Dashboard - Filter instances by status
    response = client.get("/api/v1/instances?status=RUNNING", headers=user_headers)
    assert response.status_code == 200
    instances = response.json()
    for inst in instances:
        assert inst["status"] == "RUNNING"


def test_get_instance_detail(client, user_headers):
    # AC: Cloud Resource Dashboard - Retrieve detailed instance record
    response = client.get("/api/v1/instances/inst-web-001", headers=user_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == "inst-web-001"
    assert data["name"] == "web-server-01"
    assert data["status"] == "RUNNING"
    assert data["public_ip"] is not None


def test_provision_instance_admin(client, admin_headers):
    # AC: Instance Management & Provisioning - Admin can provision new VM resources
    payload = {
        "name": "worker-node-01",
        "provider_id": "prov-aws-001",
        "region": "us-east-1b",
        "instance_type": "c5.large",
        "image_id": "ami-ubuntu-22.04",
    }
    response = client.post("/api/v1/instances", json=payload, headers=admin_headers)
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "worker-node-01"
    assert data["status"] == "RUNNING"
    assert data["external_instance_id"].startswith("i-")
    assert data["public_ip"] is not None
    assert data["private_ip"] is not None


def test_provision_instance_read_only_forbidden(client, user_headers):
    # AC: Access Control & Security - Read-only user cannot provision VM instances
    payload = {
        "name": "unauthorized-node",
        "provider_id": "prov-aws-001",
        "region": "us-east-1b",
        "instance_type": "c5.large",
    }
    response = client.post("/api/v1/instances", json=payload, headers=user_headers)
    assert response.status_code == 403


def test_instance_lifecycle_actions_admin(client, admin_headers):
    # AC: Instance Management & Provisioning - Stop, Start, Restart, Terminate
    # 1. Stop instance
    resp_stop = client.post(
        "/api/v1/instances/inst-web-001/action",
        json={"action": "STOP"},
        headers=admin_headers,
    )
    assert resp_stop.status_code == 200
    assert resp_stop.json()["current_status"] == "STOPPED"

    # 2. Start instance
    resp_start = client.post(
        "/api/v1/instances/inst-web-001/action",
        json={"action": "START"},
        headers=admin_headers,
    )
    assert resp_start.status_code == 200
    assert resp_start.json()["current_status"] == "RUNNING"

    # 3. Restart instance
    resp_restart = client.post(
        "/api/v1/instances/inst-web-001/action",
        json={"action": "RESTART"},
        headers=admin_headers,
    )
    assert resp_restart.status_code == 200
    assert resp_restart.json()["current_status"] == "RUNNING"

    # 4. Terminate instance
    resp_term = client.post(
        "/api/v1/instances/inst-web-001/action",
        json={"action": "TERMINATE"},
        headers=admin_headers,
    )
    assert resp_term.status_code == 200
    assert resp_term.json()["current_status"] == "TERMINATED"


def test_instance_action_read_only_forbidden(client, user_headers):
    # AC: Access Control & Security - Read-only users cannot perform lifecycle actions
    response = client.post(
        "/api/v1/instances/inst-web-001/action",
        json={"action": "STOP"},
        headers=user_headers,
    )
    assert response.status_code == 403


def test_instance_invalid_action(client, admin_headers):
    # AC: Instance Management - Invalid lifecycle action returns 400
    response = client.post(
        "/api/v1/instances/inst-web-001/action",
        json={"action": "INVALID_ACTION"},
        headers=admin_headers,
    )
    assert response.status_code == 400


def test_get_instance_metrics_telemetry(client, user_headers):
    # AC: Cloud Resource Dashboard - Displays CPU/RAM utilization and status metrics
    response = client.get(
        "/api/v1/instances/inst-web-001/metrics", headers=user_headers
    )
    assert response.status_code == 200
    data = response.json()
    assert "cpu_utilization_pct" in data
    assert "memory_utilization_pct" in data
    assert "disk_read_bytes_sec" in data
    assert "network_in_bytes_sec" in data
    assert data["instance_id"] == "inst-web-001"
