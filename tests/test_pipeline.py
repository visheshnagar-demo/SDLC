"""End-to-end integration test for the Sales Order ETL runner."""

from unittest.mock import MagicMock, patch
from server.main import run_pipeline


@patch("server.main.GCSExtractor")
@patch("server.main.BigQueryLoader")
def test_run_pipeline_success(mock_loader_cls, mock_extractor_cls):
    mock_extractor = MagicMock()
    raw_records = [
        {
            "order_id": "ORD-001",
            "customer_id": "CUST-001",
            "product_id": "PROD-1",
            "product_category": "Electronics",
            "quantity": "2",
            "unit_price": "50.00",
            "total_amount": "100.00",
            "order_status": "COMPLETED",
            "created_at": "2026-05-18T10:00:00Z",
        }
    ]
    mock_extractor.extract_csv.return_value = raw_records
    mock_extractor_cls.return_value = mock_extractor

    mock_loader = MagicMock()
    mock_loader.load_records.return_value = 1
    mock_loader_cls.return_value = mock_loader

    exit_code = run_pipeline(
        source_uri="gs://test-bucket/sales.csv",
        project_id="test-project",
        dataset_id="analytics",
        table_id="new_sales_orders",
        batch_id="test-run-001",
    )

    assert exit_code == 0
    mock_extractor.extract_csv.assert_called_once_with("gs://test-bucket/sales.csv")
    mock_loader.load_records.assert_called_once()


@patch("server.main.GCSExtractor")
def test_run_pipeline_file_not_found(mock_extractor_cls):
    mock_extractor = MagicMock()
    mock_extractor.extract_csv.side_effect = FileNotFoundError("File not found")
    mock_extractor_cls.return_value = mock_extractor

    exit_code = run_pipeline(
        source_uri="gs://test-bucket/missing.csv",
        project_id="test-project",
        dataset_id="analytics",
        table_id="new_sales_orders",
        batch_id="test-run-002",
    )

    assert exit_code == 1
