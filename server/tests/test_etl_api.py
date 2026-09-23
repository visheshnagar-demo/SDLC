from unittest.mock import patch
import server.api.v1.etl  # noqa: F401


def test_api_trigger_etl_job(client):
    with patch("server.api.v1.etl.run_etl_pipeline") as mock_run:
        mock_run.return_value = {
            "status": "SUCCESS",
            "extracted_count": 10,
            "cleaned_count": 9,
            "duplicate_count": 1,
            "loaded_count": 9,
            "duration_seconds": 1.25,
        }

        response = client.post("/api/v1/etl/jobs/run")
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "ETL job executed successfully"
        assert data["result"]["status"] == "SUCCESS"
        assert data["result"]["loaded_count"] == 9


def test_api_trigger_etl_job_failure(client):
    with patch("server.api.v1.etl.run_etl_pipeline") as mock_run:
        mock_run.return_value = {
            "status": "FAILED",
            "error": "Connection timed out",
        }

        response = client.post("/api/v1/etl/jobs/run")
        assert response.status_code == 500
        data = response.json()
        assert "Connection timed out" in str(data["detail"])


def test_api_get_etl_job_status(client):
    with patch("server.api.v1.etl.get_latest_status") as mock_status:
        mock_status.return_value = {
            "status": "SUCCESS",
            "last_run_at": "2026-05-18T12:00:00Z",
            "metrics": {
                "extracted_count": 50,
                "loaded_count": 50,
            },
            "error": None,
        }

        response = client.get("/api/v1/etl/jobs/status")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "SUCCESS"
        assert data["last_run_at"] == "2026-05-18T12:00:00Z"
