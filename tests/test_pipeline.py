import json
import os
from unittest.mock import MagicMock, patch
import pytest

from pipeline.cleaner import clean_dataframe, clean_records
from pipeline.extractor import extract_data, get_cloud_sql_engine
from pipeline.loader import get_bigquery_schema, load_dataframe_to_bigquery
from pipeline.run_pipeline import run_etl_pipeline

try:
    import pandas as pd
    import numpy as np
    HAS_PANDAS = True
except ImportError:
    HAS_PANDAS = False
    pd = None
    np = None


def test_clean_records_whitespace_and_nulls():
    """Test whitespace trimming and null equivalent normalization on raw records."""
    raw_records = [
        {
            "id": " 101 ",
            "name": " Alice  ",
            "email": "alice@example.com",
            "status": "active",
            "data_val": " 123.45 ",
            "created_at": "2026-01-01 10:00:00",
        },
        {
            "id": "102",
            "name": "NULL",
            "email": "  ",
            "status": "None",
            "data_val": "n/a",
            "created_at": "2026-01-02 11:00:00",
        },
        {
            "id": " 103 ",
            "name": "Bob",
            "email": "bob@example.com",
            "status": "  NaN  ",
            "data_val": "",
            "created_at": "2026-01-03 12:00:00",
        },
    ]
    cleaned_records, metrics = clean_records(raw_records, primary_key="id")

    assert len(cleaned_records) == 3
    assert metrics["extracted_rows"] == 3
    assert metrics["cleaned_rows"] == 3
    assert metrics["dropped_duplicates"] == 0

    # ID should be trimmed
    assert cleaned_records[0]["id"] == "101"
    assert cleaned_records[2]["id"] == "103"

    # Name whitespace stripped and 'NULL' converted to null
    assert cleaned_records[0]["name"] == "Alice"
    assert cleaned_records[1]["name"] is None

    # Email empty string converted to null
    assert cleaned_records[0]["email"] == "alice@example.com"
    assert cleaned_records[1]["email"] is None

    # Status 'None' and 'NaN' converted to null
    assert cleaned_records[0]["status"] == "active"
    assert cleaned_records[1]["status"] is None
    assert cleaned_records[2]["status"] is None

    # Data val 'n/a' and '' converted to null
    assert cleaned_records[0]["data_val"] == "123.45"
    assert cleaned_records[1]["data_val"] is None
    assert cleaned_records[2]["data_val"] is None

    # Audit column added
    assert "_etl_loaded_at" in cleaned_records[0]
    assert cleaned_records[0]["_etl_loaded_at"] is not None


def test_clean_records_deduplication():
    """Test deduplication keeps latest record."""
    raw_records = [
        {"id": "1", "name": "First Alice", "email": "alice@old.com"},
        {"id": "2", "name": "Bob", "email": "bob@example.com"},
        {"id": "1", "name": "Updated Alice", "email": "alice@new.com"},
    ]
    cleaned_records, metrics = clean_records(raw_records, primary_key="id")

    assert len(cleaned_records) == 2
    assert metrics["dropped_duplicates"] == 1
    # Last duplicate should be preserved
    record_1 = [r for r in cleaned_records if r["id"] == "1"][0]
    assert record_1["name"] == "Updated Alice"
    assert record_1["email"] == "alice@new.com"


def test_clean_records_empty():
    """Test empty records handling."""
    cleaned_records, metrics = clean_records([], primary_key="id")

    assert len(cleaned_records) == 0
    assert metrics["extracted_rows"] == 0
    assert metrics["cleaned_rows"] == 0


def test_clean_dataframe_interface():
    """Test clean_dataframe accepts list of dicts or DataFrame."""
    raw_records = [
        {"id": " 201 ", "name": "Charlie ", "status": "active"},
    ]
    if HAS_PANDAS:
        df = pd.DataFrame(raw_records)
        cleaned_df, metrics = clean_dataframe(df, primary_key="id")
        assert len(cleaned_df) == 1
        assert cleaned_df.iloc[0]["id"] == "201"
        assert cleaned_df.iloc[0]["name"] == "Charlie"
    else:
        cleaned_records, metrics = clean_dataframe(raw_records, primary_key="id")
        assert len(cleaned_records) == 1
        assert cleaned_records[0]["id"] == "201"
        assert cleaned_records[0]["name"] == "Charlie"


def test_get_bigquery_schema():
    """Test BigQuery schema loading from JSON file."""
    schema = get_bigquery_schema()
    assert schema is not None
    assert len(schema) > 0
    if hasattr(schema[0], "name"):
        field_names = [f.name for f in schema]
    else:
        field_names = [f["name"] for f in schema]
    assert "id" in field_names
    assert "name" in field_names
    assert "_etl_loaded_at" in field_names


def test_extractor_missing_env_vars():
    """Test fail-fast behavior when required Cloud SQL env vars are missing."""
    with patch.dict(os.environ, {}, clear=True):
        with pytest.raises(EnvironmentError):
            get_cloud_sql_engine()


def test_loader_bigquery():
    """Test BigQuery loader executes load_table_from_dataframe or load_table_from_json."""
    mock_client = MagicMock()
    mock_job = MagicMock()
    mock_job.result.return_value.output_rows = 5
    mock_client.load_table_from_dataframe.return_value = mock_job
    mock_client.load_table_from_json.return_value = mock_job

    data = [{"id": str(i), "name": f"user_{i}"} for i in range(1, 6)]
    rows = load_dataframe_to_bigquery(
        data,
        project_id="test-project",
        dataset_id="analytics",
        table_id="postgres_test3",
        client=mock_client,
    )

    assert rows == 5


def test_end_to_end_run_pipeline():
    """Test end-to-end pipeline run with mocked extractor and loader."""
    mock_raw = [
        {"id": " 101 ", "name": "Alice ", "email": "alice@test.com"},
        {"id": "102", "name": "Bob ", "email": "bob@test.com"},
    ]

    with patch("pipeline.run_pipeline.extract_data", return_value=mock_raw), patch(
        "pipeline.run_pipeline.load_dataframe_to_bigquery", return_value=2
    ):
        result = run_etl_pipeline()

        assert result["status"] == "SUCCESS"
        assert result["extracted_rows"] == 2
        assert result["cleaned_rows"] == 2
        assert result["loaded_rows"] == 2
        assert result["duplicates_dropped"] == 0
        assert "job_id" in result
