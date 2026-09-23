"""Unit and integration tests for PostgreSQL to BigQuery ETL pipeline."""
import os
import json
import pytest

try:
    import pandas as pd
    import numpy as np
    from pipeline.transformer import DataTransformer
    HAS_PANDAS = True
except ImportError:
    HAS_PANDAS = False


@pytest.mark.skipif(not HAS_PANDAS, reason="pandas not installed in local environment")
def test_transformer_whitespace_and_nulls():
    """Verifies that whitespace is stripped and various string null representations are converted."""
    raw_data = {
        "id": ["1  ", "  2", "3"],
        "name": ["  Alpha  ", "NULL", "  Beta "],
        "value": ["10.5", "None", "20.0"],
        "status": ["active", "  ", "completed"],
        "created_at": ["2026-01-01 10:00:00", "2026-01-02 11:00:00", "2026-01-03 12:00:00"],
    }
    df = pd.DataFrame(raw_data)
    transformer = DataTransformer()
    cleaned_df = transformer.clean_data(df)

    # Check whitespace stripping
    assert cleaned_df.iloc[0]["id"] == "1"
    assert cleaned_df.iloc[0]["name"] == "Alpha"

    # Check null normalization using pd.isna (Pandas Null Testing Rule compliant)
    assert pd.isna(cleaned_df.iloc[1]["name"])
    assert pd.isna(cleaned_df.iloc[1]["status"])

    # Check numeric conversion
    assert cleaned_df.iloc[0]["value"] == 10.5
    assert pd.isna(cleaned_df.iloc[1]["value"])
    assert cleaned_df.iloc[2]["value"] == 20.0

    # Check datetime conversion
    assert pd.api.types.is_datetime64_any_dtype(cleaned_df["created_at"])


@pytest.mark.skipif(not HAS_PANDAS, reason="pandas not installed in local environment")
def test_transformer_deduplication():
    """Verifies that duplicate records are deduplicated by ID keeping the latest."""
    raw_data = {
        "id": ["1", "1", "2"],
        "name": ["First Version", "Second Version", "Two"],
        "value": ["100", "150", "200"],
    }
    df = pd.DataFrame(raw_data)
    transformer = DataTransformer()
    cleaned_df = transformer.clean_data(df)

    assert len(cleaned_df) == 2
    record_1 = cleaned_df[cleaned_df["id"] == "1"].iloc[0]
    assert record_1["name"] == "Second Version"


def test_schema_json_validity():
    """Verifies BigQuery schema file is valid JSON and contains required fields."""
    schema_file = os.path.join("schemas", "postgres_test2_schema.json")
    assert os.path.isfile(schema_file), f"Schema file not found at {schema_file}"
    with open(schema_file, "r", encoding="utf-8") as f:
        schema_data = json.load(f)

    field_names = [f["name"] for f in schema_data]
    assert "id" in field_names
    assert "name" in field_names
    assert "value" in field_names
    assert "status" in field_names
    assert "created_at" in field_names
    assert "updated_at" in field_names


def test_telemetry_emission():
    """Verifies execution summary format."""
    from pipeline.telemetry import log_execution_summary
    summary = log_execution_summary(
        pipeline_id="postgres_to_bigquery",
        status="SUCCESS",
        records_extracted=100,
        records_cleaned=98,
        records_rejected=2,
        records_loaded=98,
        duration_ms=1250.5,
    )
    assert summary["event"] == "etl_execution_summary"
    assert summary["status"] == "SUCCESS"
    assert summary["records_loaded"] == 98
