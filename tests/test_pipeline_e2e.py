"""End-to-end integration tests for the Sales Order ETL pipeline."""
import ast
import os
import pytest
from unittest.mock import MagicMock, patch


def test_main_file_syntax():
    file_path = os.path.join("server", "main.py")
    assert os.path.isfile(file_path)
    with open(file_path, "r", encoding="utf-8") as f:
        tree = ast.parse(f.read())
    assert tree is not None


def test_pipeline_e2e_success():
    pd = pytest.importorskip("pandas")
    from server.main import run_pipeline

    sample_csv_df = pd.DataFrame({
        "order_id": [1001, 1001, 1002],
        "customer_id": ["C1", "C1", "C2"],
        "customer_name": ["Alice", "Alice", "Bob"],
        "customer_email": ["alice@example.com", "alice@example.com", "bob@example.com"],
        "product_category": ["Electronics", "Electronics", "Books"],
        "amount": [299.99, 320.00, 15.50],
        "currency": ["USD", "USD", "USD"],
        "order_status": ["COMPLETED", "COMPLETED", "COMPLETED"],
        "created_at": ["2026-09-01T10:00:00Z", "2026-09-01T11:00:00Z", "2026-09-01T12:00:00Z"],
    })

    with patch("server.main.BigQueryLoader") as mock_loader_cls, patch("server.main.GCSExtractor") as mock_extractor_cls:
        mock_extractor = MagicMock()
        mock_extractor.extract.return_value = sample_csv_df
        mock_extractor_cls.return_value = mock_extractor

        mock_loader = MagicMock()
        mock_loader.load.return_value = 2
        mock_loader_cls.return_value = mock_loader

        exit_code = run_pipeline()
        assert exit_code == 0
        mock_extractor.extract.assert_called_once()
        mock_loader.load.assert_called_once()


def test_pipeline_e2e_failure_on_missing_file():
    pd = pytest.importorskip("pandas")
    from server.main import run_pipeline

    with patch("server.main.GCSExtractor") as mock_extractor_cls:
        mock_extractor = MagicMock()
        mock_extractor.extract.side_effect = FileNotFoundError("GCS file not found")
        mock_extractor_cls.return_value = mock_extractor

        with pytest.raises(SystemExit) as exc_info:
            run_pipeline()
        assert exc_info.value.code == 1
