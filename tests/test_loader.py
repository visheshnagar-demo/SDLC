"""Unit tests for BigQueryLoader module."""
from unittest.mock import patch, MagicMock
import pytest
pd = pytest.importorskip("pandas")
from pipeline.loader import BigQueryLoader


def test_loader_missing_project():
    with patch.dict("os.environ", {"GCP_PROJECT_ID": "", "PROJECT_ID": ""}):
        with pytest.raises(EnvironmentError, match="FATAL: GCP_PROJECT_ID must be set"):
            BigQueryLoader(project_id="")


@patch("google.cloud.bigquery.Client")
def test_loader_success(mock_bq_client):
    mock_client_inst = MagicMock()
    mock_job = MagicMock()
    mock_job.errors = None
    mock_client_inst.load_table_from_dataframe.return_value = mock_job
    mock_bq_client.return_value = mock_client_inst

    loader = BigQueryLoader(
        project_id="upbeat-repeater-477110-q6",
        dataset_id="analytics",
        table_id="test1",
        write_disposition="WRITE_TRUNCATE"
    )

    df = pd.DataFrame({"rank": [1], "artist": ["Taylor Swift"]})
    result = loader.load_dataframe(df)
    assert result is True
    mock_client_inst.load_table_from_dataframe.assert_called_once()


@patch("google.cloud.bigquery.Client")
def test_loader_failure_raises_error(mock_bq_client):
    mock_client_inst = MagicMock()
    mock_job = MagicMock()
    mock_job.errors = [{"message": "Access Denied"}]
    mock_client_inst.load_table_from_dataframe.return_value = mock_job
    mock_bq_client.return_value = mock_client_inst

    loader = BigQueryLoader(
        project_id="upbeat-repeater-477110-q6",
        dataset_id="analytics",
        table_id="test1"
    )

    df = pd.DataFrame({"rank": [1], "artist": ["Taylor Swift"]})
    with pytest.raises(RuntimeError, match="FATAL: BigQuery load job encountered errors"):
        loader.load_dataframe(df)
