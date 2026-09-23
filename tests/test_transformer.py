"""Unit tests for DataTransformer."""
import pytest
from server.etl.transformer import DataTransformer


def test_transformer_initialization():
    transformer = DataTransformer(error_threshold_ratio=0.2)
    assert transformer.error_threshold_ratio == 0.2


def test_transformer_empty_dataframe():
    pd = pytest.importorskip("pandas")
    transformer = DataTransformer()
    df_clean, stats, quarantined = transformer.clean_and_normalize(pd.DataFrame())
    assert df_clean.empty
    assert stats["rows_extracted"] == 0
    assert stats["rows_cleaned"] == 0
    assert len(quarantined) == 0


def test_transformer_whitespace_trimming_and_null_normalization():
    pd = pytest.importorskip("pandas")
    transformer = DataTransformer()
    raw_df = pd.DataFrame([
        {"id": " 101 ", "raw_data": "  sample content  ", "cleaned_at": "2025-01-01T12:00:00Z"},
        {"id": "102", "raw_data": "null", "cleaned_at": None},
        {"id": "103", "raw_data": "None", "cleaned_at": "2025-01-03T10:00:00Z"},
        {"id": "104", "raw_data": "N/A", "cleaned_at": ""},
    ])

    df_clean, stats, quarantined = transformer.clean_and_normalize(raw_df)

    assert len(df_clean) == 4
    assert stats["rows_extracted"] == 4
    assert stats["rows_cleaned"] == 4
    assert df_clean.iloc[0]["id"] == "101"
    assert df_clean.iloc[0]["raw_data"] == "sample content"
    
    # Check null normalization using pd.isna
    assert pd.isna(df_clean.iloc[1]["raw_data"])
    assert pd.isna(df_clean.iloc[2]["raw_data"])
    assert pd.isna(df_clean.iloc[3]["raw_data"])
    assert "ingested_at" in df_clean.columns


def test_transformer_deduplication():
    pd = pytest.importorskip("pandas")
    transformer = DataTransformer()
    raw_df = pd.DataFrame([
        {"id": "A1", "raw_data": "version 1", "cleaned_at": "2025-01-01T00:00:00Z"},
        {"id": "A1", "raw_data": "version 2 (updated)", "cleaned_at": "2025-01-01T01:00:00Z"},
        {"id": "B2", "raw_data": "record B", "cleaned_at": "2025-01-01T02:00:00Z"},
    ])

    df_clean, stats, quarantined = transformer.clean_and_normalize(raw_df)

    assert len(df_clean) == 2
    assert stats["rows_extracted"] == 3
    assert stats["rows_cleaned"] == 2
    assert stats["rows_deduplicated"] == 1
    # Last version preserved
    a1_row = df_clean[df_clean["id"] == "A1"].iloc[0]
    assert a1_row["raw_data"] == "version 2 (updated)"


def test_transformer_quarantine_invalid_records():
    pd = pytest.importorskip("pandas")
    transformer = DataTransformer(error_threshold_ratio=0.5)
    raw_df = pd.DataFrame([
        {"id": "valid_1", "raw_data": "data 1", "cleaned_at": "2025-01-01T00:00:00Z"},
        {"id": None, "raw_data": "missing id", "cleaned_at": "2025-01-01T00:00:00Z"},
        {"id": "   ", "raw_data": "blank id", "cleaned_at": "2025-01-01T00:00:00Z"},
        {"id": "valid_2", "raw_data": "data 2", "cleaned_at": "2025-01-01T00:00:00Z"},
    ])

    df_clean, stats, quarantined = transformer.clean_and_normalize(raw_df)

    assert len(df_clean) == 2
    assert stats["rows_dropped"] == 2
    assert len(quarantined) == 2
    assert list(df_clean["id"]) == ["valid_1", "valid_2"]


def test_transformer_circuit_breaker_all_dropped():
    pd = pytest.importorskip("pandas")
    transformer = DataTransformer()
    raw_df = pd.DataFrame([
        {"id": None, "raw_data": "invalid 1"},
        {"id": "", "raw_data": "invalid 2"},
    ])

    with pytest.raises(RuntimeError) as exc_info:
        transformer.clean_and_normalize(raw_df)
    assert "Circuit breaker tripped" in str(exc_info.value)
