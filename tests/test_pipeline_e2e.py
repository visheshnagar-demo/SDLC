"""End-to-End integration tests for Sales Order ETL pipeline."""
from unittest.mock import MagicMock, patch
import pytest

pytest.importorskip("pandas")
pytest.importorskip("google.cloud.storage")
pytest.importorskip("google.cloud.bigquery")

from main import run_pipeline


def test_pipeline_e2e_successful_flow():
    """Tests full pipeline run with mock GCP clients."""
    sample_csv = (
        b"order_id,customer_id,customer_name,customer_email,product_category,amount,currency,order_status,created_at\n"
        b"1001,CUST-201,Alice Johnson,alice@example.com,Electronics,299.99,USD,COMPLETED,2026-09-01T10:14:22Z\n"
        b"1002,CUST-202,Bob Smith,,Home & Kitchen,49.50,USD,COMPLETED,2026-09-01T11:05:10Z\n"
        b"1001,CUST-201,Alice Johnson,alice@example.com,Electronics,299.99,USD,COMPLETED,2026-09-01T12:00:00Z\n"
    )

    with patch("pipeline.extractor.storage.Client") as mock_storage, \
         patch("pipeline.loader.bigquery.Client") as mock_bq:

        # Storage mock setup
        storage_inst = mock_storage.return_value
        bucket = storage_inst.bucket.return_value
        blob = bucket.blob.return_value
        blob.exists.return_value = True
        blob.download_as_bytes.return_value = sample_csv

        # BigQuery mock setup
        bq_inst = mock_bq.return_value
        load_job = MagicMock()
        load_job.errors = None
        bq_inst.load_table_from_dataframe.return_value = load_job

        exit_code = run_pipeline()
        assert exit_code == 0
        bq_inst.load_table_from_dataframe.assert_called_once()
