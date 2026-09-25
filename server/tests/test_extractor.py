"""Tests for PostgreSQL Extractor Module."""
import pytest
from unittest.mock import patch, MagicMock

pd = pytest.importorskip("pandas")
from server.etl.config import Settings
from server.etl.extractor import get_postgres_engine, extract_postgres_data


def test_extractor_missing_config_raises_error():
    """Verifies that missing connection parameters raise an EnvironmentError."""
    settings = Settings(
        instance_connection_name="",
        postgres_user="",
        database_url=None,
    )
    with pytest.raises(EnvironmentError) as exc_info:
        get_postgres_engine(settings)
    assert "Database connection parameters missing" in str(exc_info.value)


@patch("pandas.read_sql")
@patch("server.etl.extractor.get_postgres_engine")
def test_extract_postgres_data_success(mock_get_engine, mock_read_sql):
    """Verifies successful data extraction query and DataFrame return."""
    mock_engine = MagicMock()
    mock_connector = MagicMock()
    mock_get_engine.return_value = (mock_engine, mock_connector)

    sample_df = pd.DataFrame([
        {"id": "1", "data_payload": "alpha", "status": "active"},
        {"id": "2", "data_payload": "beta", "status": "pending"},
    ])
    mock_read_sql.return_value = sample_df

    settings = Settings()
    result_df = extract_postgres_data(settings)

    assert len(result_df) == 2
    assert "id" in result_df.columns
    mock_engine.dispose.assert_called_once()
    mock_connector.close.assert_called_once()
