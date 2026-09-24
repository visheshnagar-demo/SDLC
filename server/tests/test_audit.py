from fastapi.testclient import TestClient


def test_audit_logs_retrieval(client: TestClient):
    resp = client.get("/api/v1/audit?skip=0&limit=20")
    assert resp.status_code == 200
    data = resp.json()
    assert "total" in data
    assert "items" in data
    assert isinstance(data["items"], list)
    assert len(data["items"]) >= 1

    first_log = data["items"][0]
    assert "entity_type" in first_log
    assert "action" in first_log
    assert "actor" in first_log
    assert "created_at" in first_log
