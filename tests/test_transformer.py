import pytest
import pandas as pd
from server.transformer import DataTransformer


def test_transformer_whitespace_and_null_normalization():
    raw_data = {
        "id": ["1", "2", "3", "4"],
        "name": ["  Acme Corp  ", "NULL", "  Beta LLC", "N/A"],
        "category": ["electronics", "None", "FINANCE  ", ""],
        "amount": ["120.50", "invalid_num", "300", None],
        "status": [" active ", "pending", "closed ", "null"],
        "created_at": ["2026-01-01 10:00:00", "2026-01-02", "bad_date", None],
    }
    df_raw = pd.DataFrame(raw_data)
    transformer = DataTransformer()
    df_cleaned, metrics = transformer.clean_and_transform(df_raw)

    assert len(df_cleaned) == 4
    # Check whitespace trimming
    assert df_cleaned.iloc[0]["name"] == "Acme Corp"
    assert df_cleaned.iloc[2]["name"] == "Beta LLC"
    assert df_cleaned.iloc[0]["status"] == "active"

    # Check null normalization
    assert pd.isna(df_cleaned.iloc[1]["name"]) or df_cleaned.iloc[1]["name"] is None
    assert pd.isna(df_cleaned.iloc[3]["name"]) or df_cleaned.iloc[3]["name"] is None
    assert pd.isna(df_cleaned.iloc[1]["category"]) or df_cleaned.iloc[1]["category"] is None

    # Check amount coercion
    assert df_cleaned.iloc[0]["amount"] == 120.50
    assert pd.isna(df_cleaned.iloc[1]["amount"])
    assert df_cleaned.iloc[2]["amount"] == 300.0

    # Check category uppercase
    assert df_cleaned.iloc[0]["category"] == "ELECTRONICS"
    assert df_cleaned.iloc[2]["category"] == "FINANCE"

    # Check _etl_loaded_at injected
    assert "_etl_loaded_at" in df_cleaned.columns


def test_transformer_deduplication():
    raw_data = {
        "id": ["1", "1", "2", "3", "3"],
        "name": ["First Item", "Duplicate First", "Second Item", "Third", "Third duplicate"],
    }
    df_raw = pd.DataFrame(raw_data)
    transformer = DataTransformer()
    df_cleaned, metrics = transformer.clean_and_transform(df_raw)

    assert len(df_cleaned) == 3
    assert metrics["duplicate_count"] == 2
    assert list(df_cleaned["id"]) == ["1", "2", "3"]


def test_transformer_quarantine_invalid_ids():
    raw_data = {
        "id": ["1", None, "", "   ", "2"],
        "name": ["A", "B", "C", "D", "E"],
    }
    df_raw = pd.DataFrame(raw_data)
    transformer = DataTransformer()
    df_cleaned, metrics = transformer.clean_and_transform(df_raw)

    assert len(df_cleaned) == 2
    assert metrics["quarantined_count"] == 3
    assert list(df_cleaned["id"]) == ["1", "2"]


def test_transformer_empty_dataframe():
    df_raw = pd.DataFrame()
    transformer = DataTransformer()
    df_cleaned, metrics = transformer.clean_and_transform(df_raw)

    assert df_cleaned.empty
    assert metrics["extracted_count"] == 0
    assert metrics["cleaned_count"] == 0
