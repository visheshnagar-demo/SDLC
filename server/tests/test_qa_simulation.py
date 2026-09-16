import sys
import os

# Add server directory to sys.path to simulate QA imports
server_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if server_dir not in sys.path:
    sys.path.insert(0, server_dir)


def test_qa_double_import_simulation():
    # Simulate QA importing as models and server.models
    import server.models
    import models  # noqa: F401

    assert server.models.SubscriptionTier is models.SubscriptionTier


def test_invalid_and_suspended_tenant_header(client):
    # Test invalid tenant header returns 403
    response = client.get(
        "/api/v1/tenants", headers={"X-Tenant-ID": "non-existent-tenant"}
    )
    assert response.status_code == 403
    assert response.json()["detail"] == "Tenant is suspended or inactive"


def test_default_seeded_tenant(client):
    # Test seeded default tenant id "1"
    response = client.get("/api/v1/tenants/1")
    assert response.status_code == 200
    data = response.json()
    assert data["slug"] == "demo-corp"
