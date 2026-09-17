"""Unit tests for DataTransformer."""
import json
import pytest
from server.etl.transformer import DataTransformer

try:
    import pandas as pd
except ImportError:
    pd = None


def test_sanitize_column_name():
    assert DataTransformer.sanitize_column_name("First Name") == "first_name"
    assert DataTransformer.sanitize_column_name("User-ID & Tag") == "user_id_tag"
    assert DataTransformer.sanitize_column_name("123col") == "col_123col"
    assert DataTransformer.sanitize_column_name("   total_amount   ") == "total_amount"


def test_clean_cell_value():
    assert DataTransformer.clean_cell_value("") is None
    assert DataTransformer.clean_cell_value("   ") is None
    assert DataTransformer.clean_cell_value("NA") is None
    assert DataTransformer.clean_cell_value("null") is None
    assert DataTransformer.clean_cell_value("N/A") is None
    assert DataTransformer.clean_cell_value(" valid string ") == "valid string"
    assert DataTransformer.clean_cell_value(123) == "123"


def test_parse_timestamp():
    ts = DataTransformer.parse_timestamp("2026-09-17 12:00:00")
    assert ts == "2026-09-17T12:00:00Z"
    assert DataTransformer.parse_timestamp("invalid-date") is None
    assert DataTransformer.parse_timestamp(None) is None


def test_transformer_full_transformation():
    raw_data = [
        {"User ID": "USR-1", "Created Date": "2026-01-01 10:00:00", "Status": "active", "Balance": "1500.50"},
        {"User ID": "USR-2", "Created Date": "2026-01-02 15:30:00", "Status": "NA", "Balance": "300"},
    ]
    if pd is not None:
        input_data = pd.DataFrame(raw_data)
    else:
        input_data = raw_data

    transformer = DataTransformer(source_file="gs://sdlc-workspec-store/etl/data/my_file (1).csv")
    result = transformer.transform(input_data)

    assert result.rows_extracted == 2
    assert result.rows_transformed == 2
    assert result.rows_rejected == 0
    assert len(result.valid_records) == 2

    first_record = result.valid_records[0]
    assert first_record["record_id"] == "USR-1"
    assert first_record["created_at"] == "2026-01-01T10:00:00Z"
    assert first_record["_source_file"] == "gs://sdlc-workspec-store/etl/data/my_file (1).csv"
    assert "_ingestion_timestamp" in first_record

    payload = json.loads(first_record["data_payload"])
    assert payload["user_id"] == "USR-1"
    assert payload["status"] == "active"
    assert payload["balance"] == "1500.50"

    second_payload = json.loads(result.valid_records[1]["data_payload"])
    assert "status" not in second_payload


def test_transformer_empty_data():
    if pd is not None:
        input_data = pd.DataFrame()
    else:
        input_data = []

    transformer = DataTransformer()
    result = transformer.transform(input_data)
    assert result.rows_extracted == 0
    assert result.rows_transformed == 0
    assert result.rows_rejected == 0
    assert len(result.valid_records) == 0
