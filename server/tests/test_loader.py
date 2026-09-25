"""Tests for BigQuery Loader Module."""
import pytest
from unittest.mock import patch, MagicMock

try:
    import pandas as pd
except (ImportError, Exception):
    pd = None


def test_load_empty_dataframe():
    """Verifies that an empty DataFrame returns 0 without calling BigQuery."""
    if pd is None:
        pytest.skip("pandas not available or C extension not built")
    from server.etl.loader import load_data_to_bigquery
    empty_df = pd.DataFrame()
    loaded = load_data_to_bigquery(empty_df)
    assert loaded == 0


def test_load_data_to_bigquery_success():
    """Verifies that BigQuery client is invoked and load job is executed."""
    if pd is None:
        pytest.skip("pandas not available or C extension not built")
    from server.etl.config import Settings
    from server.etl.loader import load_data_to_bigquery

    with patch("google.cloud.bigquery.Client") as mock_bq_client_cls:
        mock_client = MagicMock()
        mock_bq_client_cls.return_value = mock_client
        mock_job = MagicMock()
        mock_client.load_table_from_dataframe.return_value = mock_job

        df = pd.DataFrame([
            {"id": "1", "data_payload": "alpha", "status": "active"},
        ])

        settings = Settings(
            gcp_project_id="upbeat-repeater-477110-q6",
            bigquery_dataset="analytics",
            bigquery_table="postgres_test3",
        )

        loaded_count = load_data_to_bigquery(df, settings)

        assert loaded_count == 1
        mock_client.load_table_from_dataframe.assert_called_once()
        mock_job.result.assert_called_once()
