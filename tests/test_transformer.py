"""Unit tests for data transformation and sanitization module."""
import ast
import os
import pytest
import pandas as pd
from src.transformer import DataSanitizer


def test_transformer_module_syntax():
    """Verifies that the transformer module has valid Python syntax."""
    file_path = os.path.join("src", "transformer.py")
    assert os.path.isfile(file_path)
    with open(file_path, "r", encoding="utf-8") as f:
        code = f.read()
    assert ast.parse(code) is not None


def test_clean_whitespace_and_nulls():
    """Verifies whitespace trimming and null normalization."""
    data = {
        "id": [1, 2, 3, 4],
        "name": ["  Alice  ", "Bob", "  Charlie  ", "   "],
        "email": ["alice@example.com", "null", "charlie@example.com", "NULL"],
        "created_at": ["2026-01-01 10:00:00", "2026-01-02", "2026-01-03 12:00:00", "2026-01-04"],
    }
    df = pd.DataFrame(data)
    cleaned_df, metrics = DataSanitizer.clean(df)

    assert len(cleaned_df) == 4
    assert cleaned_df.iloc[0]["name"] == "Alice"
    assert cleaned_df.iloc[2]["name"] == "Charlie"
    assert pd.isna(cleaned_df.iloc[3]["name"])
    assert pd.isna(cleaned_df.iloc[1]["email"])
    assert pd.isna(cleaned_df.iloc[3]["email"])
    assert metrics.duplicates_removed == 0


def test_clean_deduplication():
    """Verifies duplicate removal."""
    data = {
        "id": [1, 1, 2, 3],
        "name": ["Alice", "Alice", "Bob", "Charlie"],
        "email": ["a@a.com", "a@a.com", "b@b.com", "c@c.com"],
        "created_at": ["2026-01-01", "2026-01-01", "2026-01-02", "2026-01-03"],
    }
    df = pd.DataFrame(data)
    cleaned_df, metrics = DataSanitizer.clean(df)

    assert len(cleaned_df) == 3
    assert metrics.duplicates_removed == 1
    assert metrics.extracted_count == 4
    assert metrics.sanitized_count == 3


def test_clean_empty_dataframe():
    """Verifies handling of empty input DataFrame."""
    df = pd.DataFrame()
    cleaned_df, metrics = DataSanitizer.clean(df)

    assert len(cleaned_df) == 0
    assert metrics.extracted_count == 0
    assert metrics.sanitized_count == 0


def test_clean_circuit_breaker():
    """Verifies circuit breaker raises RuntimeError when all rows are dropped."""
    data = {
        "col1": [None, None],
        "col2": ["", "  "],
    }
    df = pd.DataFrame(data)
    with pytest.raises(RuntimeError) as exc_info:
        DataSanitizer.clean(df)
    assert "Circuit breaker triggered" in str(exc_info.value)
