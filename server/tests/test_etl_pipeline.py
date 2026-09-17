"""Unit and integration tests for the ETL pipeline components and FastAPI endpoints."""
import json
import pytest
from server.etl.config import ETLConfig
from server.etl.extractor import GCSExtractor
from server.etl.transformer import Transformer
from server.etl.loader import BigQueryLoader
from server.etl.deadletter import DeadLetterRouter


def test_extractor_local_fallback():
    extractor = GCSExtractor(gcs_uri="gs://sdlc-workspec-store/etl/data/my_file (1).csv")
    records = extractor.extract_raw_csv()
    assert isinstance(records, list)
    assert len(records) > 0
    assert "id" in records[0] or "name" in records[0]


def test_transformer_valid_and_malformed():
    transformer = Transformer(job_id="test-job-123", source_file_path="gs://test/sample.csv")
    raw_data = [
        {"id": "1", "Product Name": "Widget", "Price": "19.99"},
        {"id": "2", "Product Name": "Gadget", "Price": "29.99"},
    ]
    valid_recs, malformed_recs = transformer.transform_records(raw_data)
    assert len(valid_recs) == 2
    assert len(malformed_recs) == 0

    assert valid_recs[0]["ingestion_batch_id"] == "test-job-123"
    assert "record_id" in valid_recs[0]
    data_fields = json.loads(valid_recs[0]["data_fields"])
    assert "product_name" in data_fields
    assert data_fields["product_name"] == "Widget"


def test_transformer_sanitization():
    assert Transformer.sanitize_column_name(" First Name ") == "first_name"
    assert Transformer.sanitize_column_name("123_invalid") == "f_123_invalid"
    assert Transformer.sanitize_column_name("Item-Count#") == "item_count_"


def test_loader_and_deadletter_routing():
    loader = BigQueryLoader(
        project_id="upbeat-repeater-477110-q6",
        dataset_id="analytics",
        table_id="gcs_transformed_data",
    )
    assert loader.load_records([]) is True
    assert loader.load_records([{"record_id": "r1"}]) is True

    deadletter = DeadLetterRouter(
        project_id="upbeat-repeater-477110-q6",
        dataset_id="analytics",
        table_id="etl_deadletter_records",
    )
    assert deadletter.route_deadletter([]) is True
    assert deadletter.route_deadletter([{"error_id": "e1", "job_id": "j1"}]) is True


def test_fastapi_endpoints():
    try:
        from fastapi.testclient import TestClient
        from server.main import app
        client = TestClient(app)

        health_resp = client.get("/api/v1/etl/health")
        assert health_resp.status_code == 200
        health_json = health_resp.json()
        assert health_json["status"] == "healthy"
        assert health_json["gcp_project"] == "upbeat-repeater-477110-q6"

        run_resp = client.post("/api/v1/etl/jobs/run", json={
            "source_gcs_uri": "gs://sdlc-workspec-store/etl/data/my_file (1).csv",
            "target_project": "upbeat-repeater-477110-q6",
            "target_dataset": "analytics",
            "target_table": "gcs_transformed_data",
        })
        assert run_resp.status_code == 200
        run_json = run_resp.json()
        assert run_json["status"] in ("COMPLETED", "PARTIAL_SUCCESS")
        assert run_json["metrics"]["total_rows_read"] > 0
    except ImportError:
        pass
