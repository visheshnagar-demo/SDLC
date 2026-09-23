"""Unit tests for CloudSQLExtractor."""
import pytest
from unittest.mock import MagicMock, patch
from server.etl.extractor import CloudSQLExtractor


def test_extractor_missing_env_raises_error():
    with patch.dict("os.environ", {}, clear=True):
        with pytest.raises(EnvironmentError) as exc_info:
            CloudSQLExtractor()
        assert "INSTANCE_CONNECTION_NAME" in str(exc_info.value)


def test_extractor_initialization():
    extractor = CloudSQLExtractor(
        instance_connection_name="project:region:instance",
        db_name="postgres",
        user="559906504681-compute@developer",
        ip_type_str="PRIVATE",
    )
    assert extractor.instance_connection_name == "project:region:instance"
    assert extractor.db_name == "postgres"
    assert extractor.user == "559906504681-compute@developer"


def test_extractor_empty_table_name_raises_value_error():
    extractor = CloudSQLExtractor(
        instance_connection_name="project:region:instance",
        db_name="postgres",
        user="559906504681-compute@developer",
    )
    with pytest.raises(ValueError):
        extractor.extract_table(table_name="")


def test_extractor_extract_table_success():
    pd = pytest.importorskip("pandas")
    extractor = CloudSQLExtractor(
        instance_connection_name="project:region:instance",
        db_name="postgres",
        user="559906504681-compute@developer",
    )
    mock_engine = MagicMock()
    mock_conn = MagicMock()
    mock_engine.connect.return_value.__enter__.return_value = mock_conn

    sample_df = pd.DataFrame([
        {"id": "1", "raw_data": "record one", "cleaned_at": "2025-01-01T00:00:00Z"},
        {"id": "2", "raw_data": "record two", "cleaned_at": "2025-01-02T00:00:00Z"},
    ])

    with patch("pandas.read_sql", return_value=sample_df):
        result_df = extractor.extract_table(table_name="test_data", engine=mock_engine)
        assert len(result_df) == 2
        assert list(result_df["id"]) == ["1", "2"]


def test_extractor_retry_failure():
    extractor = CloudSQLExtractor(
        instance_connection_name="project:region:instance",
        db_name="postgres",
        user="559906504681-compute@developer",
    )
    mock_engine = MagicMock()
    mock_conn = MagicMock()
    mock_engine.connect.return_value.__enter__.return_value = mock_conn

    with patch("server.etl.extractor.pd") as mock_pd:
        mock_pd.read_sql.side_effect = Exception("Database connection timeout")
        with pytest.raises(RuntimeError) as exc_info:
            extractor.extract_table(table_name="test_data", engine=mock_engine, max_retries=2, backoff_sec=0.01)
        assert "Failed to extract data" in str(exc_info.value)
