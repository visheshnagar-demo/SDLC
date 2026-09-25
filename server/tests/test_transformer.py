"""Tests for Data Transformation Module."""
import pytest
pd = pytest.importorskip("pandas")
from server.etl.transformer import transform_and_clean_data, clean_string_value


def test_clean_string_value():
    """Verifies whitespace trimming and sentinel null conversion."""
    assert clean_string_value("  hello  ") == "hello"
    assert clean_string_value("   ") is None
    assert clean_string_value("NULL") is None
    assert clean_string_value("None") is None
    assert clean_string_value("n/a") is None
    assert clean_string_value(None) is None


def test_transform_and_clean_data_success():
    """Verifies that columns are normalized, whitespace trimmed, and timestamps parsed."""
    raw_df = pd.DataFrame([
        {
            "id": "  ID-001  ",
            "data_payload": "  Sample payload data  ",
            "status": " active ",
            "created_at": "2026-05-18T10:00:00Z",
            "updated_at": "2026-05-18T11:00:00Z",
        },
        {
            "id": "ID-002",
            "data_payload": "null",
            "status": "N/A",
            "created_at": "2026-05-18T12:00:00Z",
            "updated_at": "2026-05-18T13:00:00Z",
        },
    ])

    cleaned_df = transform_and_clean_data(raw_df)

    assert len(cleaned_df) == 2
    assert cleaned_df.iloc[0]["id"] == "ID-001"
    assert cleaned_df.iloc[0]["data_payload"] == "Sample payload data"
    assert cleaned_df.iloc[0]["status"] == "active"
    assert pd.notna(cleaned_df.iloc[0]["created_at"])
    assert "etl_loaded_at" in cleaned_df.columns

    # Test normalized nulls with pd.isna
    assert pd.isna(cleaned_df.iloc[1]["data_payload"])
    assert pd.isna(cleaned_df.iloc[1]["status"])


def test_transform_empty_dataframe():
    """Verifies handling of an empty input DataFrame."""
    empty_df = pd.DataFrame()
    result = transform_and_clean_data(empty_df)
    assert len(result) == 0


def test_circuit_breaker_on_all_invalid():
    """Verifies circuit breaker raises RuntimeError when all rows are completely null."""
    all_null_df = pd.DataFrame([
        {"id": None, "data_payload": None, "status": None},
        {"id": "", "data_payload": "NULL", "status": "n/a"},
    ])
    # The second row becomes all None after cleaning, so all rows are dropped
    with pytest.raises(RuntimeError) as exc_info:
        transform_and_clean_data(all_null_df)
    assert "Circuit breaker triggered" in str(exc_info.value)
