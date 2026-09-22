"""Tests for Resource Metrics Telemetry."""

from fastapi import status


def test_get_instance_metrics(client, readonly_token_headers):
    """Test retrieving metrics for an instance."""
    inst_res = client.get("/api/v1/instances", headers=readonly_token_headers)
    instance_id = inst_res.json()[0]["id"]

    response = client.get(
        f"/api/v1/instances/{instance_id}/metrics",
        headers=readonly_token_headers,
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["instance_id"] == instance_id
    assert "metrics" in data
    assert isinstance(data["metrics"], list)
    if len(data["metrics"]) > 0:
        sample = data["metrics"][0]
        assert "cpu_utilization_pct" in sample
        assert "memory_utilization_pct" in sample
        assert "disk_read_bytes_sec" in sample
        assert "network_in_bytes_sec" in sample


def test_record_instance_metric(client, admin_token_headers):
    """Test recording a new telemetry metric sample."""
    inst_res = client.get("/api/v1/instances", headers=admin_token_headers)
    instance_id = inst_res.json()[0]["id"]

    response = client.post(
        f"/api/v1/instances/{instance_id}/metrics",
        headers=admin_token_headers,
    )
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["instance_id"] == instance_id
    assert 0 <= data["cpu_utilization_pct"] <= 100
    assert 0 <= data["memory_utilization_pct"] <= 100


def test_get_metrics_instance_not_found(client, readonly_token_headers):
    """Test metrics for non-existent instance returns 404."""
    response = client.get(
        "/api/v1/instances/fake-non-existent-instance-id/metrics",
        headers=readonly_token_headers,
    )
    assert response.status_code == status.HTTP_404_NOT_FOUND
