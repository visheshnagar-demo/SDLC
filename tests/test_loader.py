"""Unit tests for BigQuery loader."""
from unittest.mock import MagicMock, patch
import pytest

pd = pytest.importorskip("pandas")
pytest.importorskip("google.cloud.bigquery")

from pipeline.config import PipelineConfig
from pipeline.loader import BigQueryLoader


@pytest.fixture
def mock_config():
    return PipelineConfig(
        gcp_project_id="upbeat-repeater-477110-q6",
        bigquery_dataset="analytics",
        bigquery_table="vishesh-test1",
        gcs_source_bucket="sdlc-workspec-store",
        gcs_source_prefix="etl/data/raw_sales_data.csv",
        staging_dir="staging/test",
        write_disposition="WRITE_TRUNCATE",
    )


def test_loader_execution(mock_config):
    df = pd.DataFrame(
        {
            "order_id": [1001],
            "customer_id": ["CUST-1"],
            "customer_name": ["Alice"],
            "currency": ["USD"],
            "order_status": ["COMPLETED"],
            "created_at": pd.to_datetime(["2026-09-01T10:00:00Z"]),
            "ingested_at": pd.to_datetime(["2026-09-01T12:00:00Z"]),
        }
    )

    with patch("pipeline.loader.bigquery.Client") as mock_bq_client:
        client_instance = mock_bq_client.return_value
        load_job_mock = MagicMock()
        load_job_mock.errors = None
        client_instance.load_table_from_dataframe.return_value = load_job_mock

        loader = BigQueryLoader(mock_config)
        loaded_rows = loader.load(df)

        assert loaded_rows == 1
        client_instance.load_table_from_dataframe.assert_called_once()
        load_job_mock.result.assert_called_once()


def test_loader_raises_error_on_job_failure(mock_config):
    df = pd.DataFrame({"order_id": [1001]})

    with patch("pipeline.loader.bigquery.Client") as mock_bq_client:
        client_instance = mock_bq_client.return_value
        load_job_mock = MagicMock()
        load_job_mock.errors = [{"message": "Access Denied"}]
        client_instance.load_table_from_dataframe.return_value = load_job_mock

        loader = BigQueryLoader(mock_config)
        with pytest.raises(RuntimeError, match="FATAL: BigQuery load failed with errors"):
            loader.load(df)
