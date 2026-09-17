"""Unit tests for BigQuery Loader."""

from datetime import datetime, timezone
from decimal import Decimal
from unittest.mock import MagicMock
import pytest
from google.cloud.exceptions import NotFound
from server.loader import BigQueryLoader
from server.models import SalesOrderRecord


def create_sample_record(order_id: str = "ORD-001") -> SalesOrderRecord:
    return SalesOrderRecord(
        order_id=order_id,
        customer_id="CUST-100",
        product_id="PROD-500",
        product_category="Gadgets",
        quantity=2,
        unit_price=Decimal("19.99"),
        total_amount=Decimal("39.98"),
        order_status="COMPLETED",
        created_at=datetime.now(timezone.utc),
        ingested_at=datetime.now(timezone.utc),
        batch_id="test-batch-001",
    )


def test_ensure_table_exists_when_dataset_and_table_missing():
    mock_bq_client = MagicMock()
    # Dataset not found, table not found
    mock_bq_client.get_dataset.side_effect = NotFound("Dataset not found")
    mock_bq_client.get_table.side_effect = NotFound("Table not found")

    loader = BigQueryLoader(project_id="test-project", client=mock_bq_client)
    loader.ensure_table_exists("analytics", "new_sales_orders")

    mock_bq_client.create_dataset.assert_called_once()
    mock_bq_client.create_table.assert_called_once()


def test_load_records_empty_list():
    mock_bq_client = MagicMock()
    loader = BigQueryLoader(project_id="test-project", client=mock_bq_client)
    loaded_count = loader.load_records([], "analytics", "new_sales_orders")

    assert loaded_count == 0
    mock_bq_client.load_table_from_json.assert_not_called()


def test_load_records_success():
    mock_bq_client = MagicMock()
    mock_job = MagicMock()
    mock_job.errors = None
    mock_job.output_rows = 2
    mock_job.job_id = "job-test-12345"
    mock_bq_client.load_table_from_json.return_value = mock_job

    loader = BigQueryLoader(project_id="test-project", client=mock_bq_client)
    records = [create_sample_record("ORD-001"), create_sample_record("ORD-002")]
    
    loaded_count = loader.load_records(records, "analytics", "new_sales_orders")

    assert loaded_count == 2
    mock_bq_client.load_table_from_json.assert_called_once()
    mock_job.result.assert_called_once()


def test_load_records_failure_raises_error():
    mock_bq_client = MagicMock()
    mock_job = MagicMock()
    mock_job.errors = [{"message": "Invalid field value"}]
    mock_job.job_id = "job-fail-12345"
    mock_bq_client.load_table_from_json.return_value = mock_job

    loader = BigQueryLoader(project_id="test-project", client=mock_bq_client)
    records = [create_sample_record("ORD-001")]

    with pytest.raises(RuntimeError, match="BigQuery load job failed with errors"):
        loader.load_records(records, "analytics", "new_sales_orders")
