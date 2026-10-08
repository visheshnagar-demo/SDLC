"""Unit and integration test suite for PostgreSQL to BigQuery ETL pipeline."""
import pytest
from datetime import datetime
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient

from server.schemas.etl_schemas import (
    RawTestDataRecord,
    CleanedPostgresTest5Record,
    DeadLetterRecord,
    ETLRunRequest,
    ETLRunResponse,
    ETLHealthResponse,
)
from server.transformer import DataTransformer
from server.main import app, run_pipeline

client = TestClient(app)


def test_schema_models_instantiation():
    """Validates schema Pydantic models."""
    raw = RawTestDataRecord(
        id="rec_1001",
        payload_data='{"event": "login"}',
        status="ACTIVE",
        source_created_at=datetime(2026, 1, 1, 12, 0, 0),
    )
    assert raw.id == "rec_1001"
    assert raw.status == "ACTIVE"

    cleaned = CleanedPostgresTest5Record(
        id="rec_1001",
        payload_data='{"event": "login"}',
        status="ACTIVE",
        source_created_at=datetime(2026, 1, 1, 12, 0, 0),
        etl_batch_id="batch-123",
    )
    assert cleaned.id == "rec_1001"
    assert cleaned.etl_batch_id == "batch-123"

    dead_letter = DeadLetterRecord(
        id="dlq_1",
        source_record_id=None,
        raw_record="{}",
        rejection_reason="Missing ID",
        batch_id="batch-123",
    )
    assert dead_letter.rejection_reason == "Missing ID"


def test_transformer_valid_and_invalid_records():
    """Tests DataTransformer handling valid rows, missing IDs, nulls, and timestamp parsing."""
    transformer = DataTransformer(batch_id="test-batch-001")
    raw_data = [
        {
            "id": "101",
            "payload_data": "  sample test data  ",
            "status": "active",
            "source_created_at": "2026-02-15T08:30:00Z",
        },
        {
            "id": " 102 ",
            "payload_data": None,
            "status": None,
            "source_created_at": None,
        },
        {
            "id": None,
            "payload_data": "missing id item",
            "status": "pending",
            "source_created_at": "2026-02-15T08:30:00Z",
        },
        {
            "id": "   ",
            "payload_data": "empty id item",
            "status": "pending",
            "source_created_at": "2026-02-15T08:30:00Z",
        },
    ]

    cleaned, dead_letters = transformer.transform_records(raw_data)

    assert len(cleaned) == 2
    assert len(dead_letters) == 2

    # Verify first cleaned record
    assert cleaned[0].id == "101"
    assert cleaned[0].payload_data == "sample test data"
    assert cleaned[0].status == "ACTIVE"
    assert cleaned[0].source_created_at is not None
    assert cleaned[0].etl_batch_id == "test-batch-001"

    # Verify second cleaned record (defaults applied)
    assert cleaned[1].id == "102"
    assert cleaned[1].payload_data is None
    assert cleaned[1].status == "UNKNOWN"
    assert cleaned[1].source_created_at is None

    # Verify dead letters
    assert dead_letters[0].rejection_reason == "Missing or null required primary key 'id'"
    assert dead_letters[1].rejection_reason == "Empty or invalid primary key 'id'"


def test_transformer_circuit_breaker():
    """Tests circuit breaker behavior when all rows are corrupted."""
    transformer = DataTransformer(batch_id="breaker-batch")
    raw_data = [
        {"id": None, "payload_data": "bad row 1"},
        {"id": "", "payload_data": "bad row 2"},
    ]
    cleaned, dead_letters = transformer.transform_records(raw_data)
    assert len(cleaned) == 0
    assert len(dead_letters) == 2


@patch("server.main.PostgresExtractor")
@patch("server.main.BigQueryLoader")
def test_run_pipeline_success(mock_loader_cls, mock_extractor_cls):
    """Tests the full pipeline orchestration logic."""
    mock_extractor = MagicMock()
    mock_extractor.extract_records.return_value = [
        {"id": "rec_1", "payload_data": "data1", "status": "COMPLETED", "source_created_at": "2026-01-01T00:00:00Z"},
        {"id": "rec_2", "payload_data": "data2", "status": "PENDING", "source_created_at": "2026-01-02T00:00:00Z"},
    ]
    mock_extractor_cls.return_value = mock_extractor

    mock_loader = MagicMock()
    mock_loader.dataset_id = "analytics"
    mock_loader.table_id = "postgres_test5"
    mock_loader.load_records.return_value = 2
    mock_loader_cls.return_value = mock_loader

    response = run_pipeline(write_disposition="WRITE_APPEND", batch_size=1000)

    assert response.status == "SUCCESS"
    assert response.records_extracted == 2
    assert response.records_cleaned == 2
    assert response.records_rejected == 0
    assert response.records_loaded == 2
    assert response.target_table == "analytics.postgres_test5"


@patch("server.main.PostgresExtractor")
@patch("server.main.BigQueryLoader")
def test_api_health_endpoint(mock_loader_cls, mock_extractor_cls):
    """Tests GET /api/v1/etl/health endpoint."""
    mock_extractor = MagicMock()
    mock_extractor.check_connection.return_value = True
    mock_extractor_cls.return_value = mock_extractor

    mock_loader = MagicMock()
    mock_loader.check_connection.return_value = True
    mock_loader_cls.return_value = mock_loader

    response = client.get("/api/v1/etl/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "HEALTHY"
    assert data["source_connected"] is True
    assert data["target_connected"] is True


@patch("server.main.run_pipeline")
def test_api_trigger_etl_endpoint(mock_run_pipeline):
    """Tests POST /api/v1/etl/run endpoint."""
    mock_run_pipeline.return_value = ETLRunResponse(
        status="SUCCESS",
        batch_id="test-batch-uuid",
        records_extracted=10,
        records_cleaned=9,
        records_rejected=1,
        records_loaded=9,
        target_table="analytics.postgres_test5",
        duration_seconds=1.23,
    )

    payload = {"write_disposition": "WRITE_APPEND", "batch_size": 100}
    response = client.post("/api/v1/etl/run", json=payload)

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "SUCCESS"
    assert data["batch_id"] == "test-batch-uuid"
    assert data["records_loaded"] == 9
