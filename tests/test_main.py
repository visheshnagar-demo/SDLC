"""End-to-end integration tests for the ETL pipeline orchestrator and CLI."""

from unittest.mock import MagicMock, patch
from datetime import datetime, timezone
import pandas as pd
from server.main import run_pipeline, main


def test_run_pipeline_end_to_end():
    """AC: Cloud Run Job Deployment & Batch Execution - Orchestrate full pipeline."""
    mock_extractor = MagicMock()
    mock_transformer = MagicMock()
    mock_loader = MagicMock()

    raw_df = pd.DataFrame([{"order_id": "ORD-1"}])
    mock_extractor.extract.return_value = raw_df

    from server.models import ETLBatchMetrics

    clean_df = pd.DataFrame(
        [{"order_id": "ORD-1", "created_at": datetime.now(timezone.utc)}]
    )
    metrics_mock = ETLBatchMetrics(
        batch_id="test-batch-e2e",
        raw_records=1,
        quarantined_records=0,
        deduplicated_records=0,
        clean_records_to_load=1,
    )
    mock_transformer.transform.return_value = (clean_df, metrics_mock)
    mock_loader.load_records.return_value = 1

    result_metrics = run_pipeline(
        gcs_uri="gs://test-bucket/test.csv",
        destination_table="analytics.new_sales_orders",
        batch_id="test-batch-e2e",
        extractor=mock_extractor,
        transformer=mock_transformer,
        loader=mock_loader,
    )

    assert result_metrics.batch_id == "test-batch-e2e"
    assert result_metrics.raw_records == 1
    assert result_metrics.clean_records_to_load == 1
    mock_extractor.extract.assert_called_once_with("gs://test-bucket/test.csv")
    mock_transformer.transform.assert_called_once_with(
        raw_df, batch_id="test-batch-e2e"
    )
    mock_loader.load_records.assert_called_once_with(
        clean_df, destination_table_id="analytics.new_sales_orders"
    )


def test_run_pipeline_empty_extraction_graceful_exit():
    """AC: GCS CSV Ingestion - Empty raw data exits gracefully without error."""
    mock_extractor = MagicMock()
    mock_extractor.extract.return_value = pd.DataFrame()

    result_metrics = run_pipeline(
        gcs_uri="gs://empty-bucket/empty.csv",
        batch_id="test-empty-batch",
        extractor=mock_extractor,
    )

    assert result_metrics.batch_id == "test-empty-batch"
    assert result_metrics.raw_records == 0
    assert result_metrics.clean_records_to_load == 0


@patch("server.main.run_pipeline")
def test_cli_main_success(mock_run_pipeline):
    """Test CLI entrypoint main() success returns code 0."""
    from server.models import ETLBatchMetrics

    mock_run_pipeline.return_value = ETLBatchMetrics(
        batch_id="cli-batch",
        raw_records=10,
        quarantined_records=1,
        deduplicated_records=1,
        clean_records_to_load=8,
    )

    with patch("sys.argv", ["main.py", "--batch-id", "cli-batch"]):
        exit_code = main()
        assert exit_code == 0
