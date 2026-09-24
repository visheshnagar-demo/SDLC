"""Unit and compatibility tests for ETL pipeline components (SCRUM-375)."""

import json
import os
import sys
from unittest.mock import MagicMock, patch
import pytest

workspace_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if workspace_root not in sys.path:
    sys.path.insert(0, workspace_root)

from pipeline.circuit_breaker import CircuitBreaker

try:
    import pandas as pd
    import numpy as np
    HAS_PANDAS = True
except ImportError:
    HAS_PANDAS = False
    pd = None
    np = None


def test_schema_json_contains_all_fields():
    """Verify test01 schema contains all fields required for Tour Record dataset."""
    schema_path = os.path.join(workspace_root, "schemas", "test01_schema.json")
    assert os.path.isfile(schema_path)
    with open(schema_path, "r", encoding="utf-8") as f:
        schema = json.load(f)
    field_names = [f["name"] for f in schema]
    for expected in ["rank", "artist", "actual_gross", "tour_title", "_etl_loaded_at", "_source_file"]:
        assert expected in field_names


def test_transformation_spec_has_required_keys():
    """Verify transformation_spec.json structure."""
    spec_path = os.path.join(workspace_root, "transformation_spec.json")
    assert os.path.isfile(spec_path)
    with open(spec_path, "r", encoding="utf-8") as f:
        spec = json.load(f)
    assert "source" in spec
    assert "target" in spec
    assert "transformations" in spec


@pytest.mark.skipif(not HAS_PANDAS, reason="pandas is required for transformation tests")
def test_transformer_cleaning_and_null_normalization():
    """Verify DataTransformer handles null normalization and footnote cleaning."""
    from pipeline.transformer import DataTransformer
    transformer = DataTransformer()
    raw_data = {
        "Rank": ["1", " 2 ", "3", "4"],
        "Artist": [" Alice ", "Bob", "  ", "N/A"],
        "Actual gross": ["$1,000,000", " $2,000,000 ", "invalid", "NULL"],
        "Tour title": [" Tour 1 ", "Tour 2", "none", ""],
    }
    raw_df = pd.DataFrame(raw_data)
    cleaned_df = transformer.transform(raw_df)

    assert len(cleaned_df) >= 2
    assert cleaned_df.iloc[0]["rank"] == 1
    assert cleaned_df.iloc[0]["artist"] == "Alice"
    assert cleaned_df.iloc[0]["actual_gross"] == 1000000


@pytest.mark.skipif(not HAS_PANDAS, reason="pandas is required for transformation tests")
def test_transformer_circuit_breaker_on_excessive_invalid_rows():
    """Verify circuit breaker trips when invalid records exceed threshold."""
    from pipeline.transformer import DataTransformer
    transformer = DataTransformer(error_threshold_ratio=0.05)
    # 2 invalid rows out of 10 rows without rank or artist -> 20% > 5%
    raw_data = {
        "Rank": [None, None, "3", "4", "5", "6", "7", "8", "9", "10"],
        "Artist": [None, "", "Artist 3", "Artist 4", "Artist 5", "Artist 6", "Artist 7", "Artist 8", "Artist 9", "Artist 10"],
    }
    raw_df = pd.DataFrame(raw_data)
    with pytest.raises(RuntimeError, match="Circuit breaker tripped"):
        transformer.transform(raw_df)


@pytest.mark.skipif(not HAS_PANDAS, reason="pandas is required for transformation tests")
def test_transformer_empty_dataframe():
    """Verify DataTransformer handles empty DataFrames safely."""
    from pipeline.transformer import DataTransformer
    transformer = DataTransformer()
    empty_df = pd.DataFrame()
    cleaned_df = transformer.transform(empty_df)
    assert cleaned_df.empty
    assert "rank" in cleaned_df.columns
    assert "_etl_loaded_at" in cleaned_df.columns


@pytest.mark.skipif(not HAS_PANDAS, reason="pandas is required for loader tests")
def test_loader_dataset_and_table_creation():
    """Verify BigQueryLoader creates dataset and table when missing."""
    from pipeline.loader import BigQueryLoader
    mock_bq_client = MagicMock()
    mock_bq_client.get_dataset.side_effect = Exception("Dataset not found")
    mock_bq_client.get_table.side_effect = [Exception("Table not found"), MagicMock(num_rows=2)]
    mock_job = MagicMock()
    mock_bq_client.load_table_from_dataframe.return_value = mock_job

    loader = BigQueryLoader(
        project_id="upbeat-repeater-477110-q6",
        dataset_id="analytics",
        table_id="test01",
        client=mock_bq_client,
    )
    df = pd.DataFrame({
        "rank": [1, 2],
        "artist": ["Artist A", "Artist B"],
        "_etl_loaded_at": pd.to_datetime(["2026-01-01", "2026-01-02"], utc=True),
        "_source_file": ["gs://bucket/file.csv", "gs://bucket/file.csv"],
    })

    loaded_rows = loader.load(df)
    assert loaded_rows == 2
    mock_bq_client.create_dataset.assert_called_once()
    mock_bq_client.create_table.assert_called_once()
    mock_bq_client.load_table_from_dataframe.assert_called_once()
