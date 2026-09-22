"""Unit test suite for ETL Pipeline components."""
import pytest
import os

try:
    import pandas as pd
except ImportError:
    pd = None


def test_settings_initialization(monkeypatch):
    """Verifies that configuration initializes properly with defaults."""
    from server.config import Settings, get_settings
    monkeypatch.setenv("GCP_PROJECT_ID", "test-project")
    monkeypatch.setenv("POSTGRES_DB", "testdb")
    settings = get_settings()
    assert settings.gcp_project_id == "test-project"
    assert settings.postgres_db == "testdb"
    assert settings.bigquery_dataset == "analytics"
    assert settings.bigquery_table == "postgres_test1"


def test_zero_sqlite_guard(monkeypatch):
    """Verifies that attempting to use SQLite raises EnvironmentError."""
    from server.config import Settings
    monkeypatch.setenv("DATABASE_URL", "sqlite:///test.db")
    settings = Settings()
    with pytest.raises(EnvironmentError, match="SQLite database URL is prohibited"):
        settings.get_database_url_or_fail()


@pytest.mark.skipif(pd is None, reason="pandas not installed")
def test_transformer_whitespace_and_null_normalization():
    """Verifies whitespace stripping and null marker normalization."""
    from server.config import Settings
    from server.transformer import DataTransformer

    settings = Settings()
    transformer = DataTransformer(settings, batch_id="test-batch-001")

    raw_data = {
        "id": [1, 2, 3, 4],
        "data_val": ["  sample_a  ", "NULL", "   ", "valid_text"],
        "created_at": ["2025-01-01 10:00:00", "2025-01-02 11:00:00", "2025-01-03 12:00:00", "2025-01-04 13:00:00"],
    }
    df_raw = pd.DataFrame(raw_data)

    df_cleaned, df_quarantine, metrics = transformer.transform(df_raw)

    assert len(df_cleaned) == 4
    assert len(df_quarantine) == 0
    assert df_cleaned.iloc[0]["data_val"] == "sample_a"
    assert pd.isna(df_cleaned.iloc[1]["data_val"])
    assert pd.isna(df_cleaned.iloc[2]["data_val"])
    assert df_cleaned.iloc[3]["data_val"] == "valid_text"
    assert metrics["cleaned"] == 4
    assert "_etl_loaded_at" in df_cleaned.columns
    assert df_cleaned.iloc[0]["_etl_batch_id"] == "test-batch-001"


@pytest.mark.skipif(pd is None, reason="pandas not installed")
def test_transformer_deduplication():
    """Verifies deduplication keeps the latest record."""
    from server.config import Settings
    from server.transformer import DataTransformer

    settings = Settings()
    transformer = DataTransformer(settings, batch_id="test-batch-002")

    raw_data = {
        "id": [1, 2, 1],
        "data_val": ["first_version", "item_2", "second_version"],
        "created_at": ["2025-01-01 10:00:00", "2025-01-01 11:00:00", "2025-01-01 12:00:00"],
    }
    df_raw = pd.DataFrame(raw_data)

    df_cleaned, df_quarantine, metrics = transformer.transform(df_raw)

    assert len(df_cleaned) == 2
    assert metrics["duplicates_dropped"] == 1
    row_1 = df_cleaned[df_cleaned["id"] == 1].iloc[0]
    assert row_1["data_val"] == "second_version"


@pytest.mark.skipif(pd is None, reason="pandas not installed")
def test_transformer_circuit_breaker():
    """Verifies that high ratio of corrupt rows trips the circuit breaker."""
    from server.config import Settings
    from server.transformer import DataTransformer

    settings = Settings(circuit_breaker_threshold=0.20)
    transformer = DataTransformer(settings, batch_id="test-batch-003")

    raw_data = {
        "id": ["corrupt_id_1", "corrupt_id_2", 3, 4],
        "data_val": ["val1", "val2", "val3", "val4"],
        "created_at": ["not_a_date", "not_a_date", "2025-01-01", "2025-01-02"],
    }
    df_raw = pd.DataFrame(raw_data)

    with pytest.raises(RuntimeError, match="Circuit breaker tripped"):
        transformer.transform(df_raw)
