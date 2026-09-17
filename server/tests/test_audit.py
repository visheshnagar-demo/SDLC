def test_query_audit_logs(client):
    client.post(
        "/api/v1/chips",
        json={
            "name": "Audit Test Chip",
            "category": "Test",
            "face_value": 1.0,
            "status": "active",
        },
    )

    res = client.get("/api/v1/audit/logs")
    assert res.status_code == 200
    logs = res.json()
    assert isinstance(logs, list)
    assert len(logs) > 0

    chip_logs = client.get("/api/v1/audit/logs?action_type=CHIP_CREATE")
    assert chip_logs.status_code == 200
    assert len(chip_logs.json()) >= 1


def test_export_audit_reports(client):
    res = client.get("/api/v1/audit/export")
    assert res.status_code == 200
    assert res.headers["content-type"].startswith("text/csv")
    assert "ID,Timestamp,Actor ID" in res.text
