"""Automated tests for GCS to BigQuery ETL pipeline (SCRUM-375)."""

import json
import os
import sys
from unittest.mock import MagicMock, patch
import pytest

workspace_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if workspace_root not in sys.path:
    sys.path.insert(0, workspace_root)

from pipeline.circuit_breaker import CircuitBreaker
from pipeline.loader import BigQueryLoader
from pipeline.transformer import clean_int_value, clean_string_value, sanitize_column_name

try:
    import pandas as pd
    import numpy as np
    HAS_PANDAS = True
except ImportError:
    HAS_PANDAS = False
    pd = None
    np = None


def test_schema_json_validity():
    """Verifies target BigQuery schema JSON structure."""
    schema_path = os.path.join(workspace_root, "schemas", "test01_schema.json")
    assert os.path.isfile(schema_path)
    with open(schema_path, "r", encoding="utf-8") as f:
        schema = json.load(f)
    assert len(schema) >= 11
    col_names = [f["name"] for f in schema]
    expected_cols = [
        "rank",
        "peak",
        "all_time_peak",
        "actual_gross",
        "adjusted_gross_in_2022_dollars",
        "artist",
        "tour_title",
        "years",
        "shows",
        "average_gross",
        "ref",
        "_etl_loaded_at",
        "_source_file",
    ]
    for col in expected_cols:
        assert col in col_names, f"Expected column '{col}' missing from schema."


def test_transformation_spec_validity():
    """Verifies transformation_spec.json structure and required top-level fields."""
    spec_path = os.path.join(workspace_root, "transformation_spec.json")
    assert os.path.isfile(spec_path)
    with open(spec_path, "r", encoding="utf-8") as f:
        spec = json.load(f)
    assert "source" in spec, "Top-level 'source' field missing from transformation_spec.json"
    assert "target" in spec, "Top-level 'target' field missing from transformation_spec.json"
    assert "transformations" in spec, "Top-level 'transformations' field missing from transformation_spec.json"
    assert "columns" in spec, "'columns' field missing from transformation_spec.json"
    assert len(spec["transformations"]) >= 10
    assert len(spec["columns"]) >= 10


def test_env_deploy_json_validity():
    """Verifies env.deploy.json structure including failure_behavior."""
    env_path = os.path.join(workspace_root, "env.deploy.json")
    assert os.path.isfile(env_path)
    with open(env_path, "r", encoding="utf-8") as f:
        env_vars = json.load(f)
    assert "failure_behavior" in env_vars or "FAILURE_BEHAVIOR" in env_vars
    assert env_vars.get("failure_behavior") == "FAIL_FAST" or env_vars.get("FAILURE_BEHAVIOR") == "FAIL_FAST"
    assert "GCP_PROJECT" in env_vars or "GCP_PROJECT_ID" in env_vars
    assert env_vars.get("BIGQUERY_DATASET") == "analytics"
    assert env_vars.get("BIGQUERY_TABLE") == "test01"


def test_sanitize_column_name():
    """Verifies sanitize_column_name normalizes column names properly."""
    assert sanitize_column_name("Rank") == "rank"
    assert sanitize_column_name("All Time Peak") == "all_time_peak"
    assert sanitize_column_name("Actual\u00a0gross") == "actual_gross"
    assert sanitize_column_name("Adjusted\u00a0gross (in 2022 dollars)") == "adjusted_gross_in_2022_dollars"
    assert sanitize_column_name("Tour title") == "tour_title"
    assert sanitize_column_name("Year(s)") == "years"
    assert sanitize_column_name("Ref.") == "ref"


def test_clean_int_value_parsing():
    """Verifies clean_int_value correctly cleans currencies, footnotes, commas, and nulls."""
    assert clean_int_value("$780,000,000") == 780000000
    assert clean_int_value("$13,928,571") == 13928571
    assert clean_int_value("1[4]") == 1
    assert clean_int_value("2[7]") == 2
    assert clean_int_value("56") == 56
    assert clean_int_value("N/A") is None
    assert clean_int_value("NULL") is None
    assert clean_int_value("") is None
    assert clean_int_value(None) is None


def test_clean_string_value_parsing():
    """Verifies clean_string_value strips whitespace and null tokens."""
    assert clean_string_value("  Taylor Swift  ") == "Taylor Swift"
    assert clean_string_value("Renaissance World Tour") == "Renaissance World Tour"
    assert clean_string_value("  ") is None
    assert clean_string_value("N/A") is None
    assert clean_string_value("null") is None
    assert clean_string_value(None) is None


def test_circuit_breaker_success_and_quarantine():
    """Tests CircuitBreaker success recording and limits."""
    cb = CircuitBreaker(max_error_rate=0.05, max_quarantine_rows=5)
    cb.set_total_extracted(100)

    for _ in range(98):
        cb.record_success()

    cb.record_quarantine(
        row_index=1,
        raw_record={"artist": None, "rank": None},
        reason="Missing key identifiers",
    )
    cb.record_quarantine(
        row_index=2,
        raw_record={"artist": None, "rank": None},
        reason="Missing key identifiers",
    )

    assert cb.rows_cleaned == 98
    assert cb.rows_quarantined == 2
    # Error rate 2/100 = 2% <= 5%, should not raise
    cb.verify_error_rate()

    summary = cb.get_summary()
    assert summary["rows_extracted"] == 100
    assert summary["rows_cleaned"] == 98
    assert summary["rows_quarantined"] == 2


def test_circuit_breaker_trips_on_excessive_error_rate():
    """Tests CircuitBreaker trip when error rate > threshold."""
    cb = CircuitBreaker(max_error_rate=0.05)
    cb.set_total_extracted(10)

    for _ in range(8):
        cb.record_success()

    # 2 quarantined out of 10 = 20% > 5%
    cb.record_quarantine(1, {}, "error")
    cb.record_quarantine(2, {}, "error")

    with pytest.raises(RuntimeError, match="Circuit breaker tripped: error rate"):
        cb.verify_error_rate()


def test_circuit_breaker_trips_on_max_quarantine():
    """Tests CircuitBreaker trip when max quarantine count exceeded."""
    cb = CircuitBreaker(max_quarantine_rows=2)
    cb.record_quarantine(1, {}, "error 1")
    cb.record_quarantine(2, {}, "error 2")
    with pytest.raises(RuntimeError, match="Circuit breaker tripped: quarantined rows"):
        cb.record_quarantine(3, {}, "error 3")


def test_loader_schema_resolution():
    """Verifies loader get_schema reads from test01_schema.json."""
    mock_client = MagicMock()
    loader = BigQueryLoader(
        project_id="upbeat-repeater-477110-q6",
        dataset_id="analytics",
        table_id="test01",
        client=mock_client,
    )
    schema = loader.get_schema()
    assert len(schema) >= 11
    names = [f.name if hasattr(f, "name") else f["name"] for f in schema]
    assert "rank" in names
    assert "artist" in names
    assert "_etl_loaded_at" in names


@pytest.mark.skipif(not HAS_PANDAS, reason="pandas is required for transformation tests")
def test_data_transformer_cleaning_and_formatting(tmp_path):
    """Tests DataTransformer cleaning, currency stripping, footnote removal, and type coercion."""
    from pipeline.transformer import DataTransformer

    raw_data = {
        "Rank": ["1", "2", "3", "4"],
        "Peak": ["1", "1[4]", "2[7]", None],
        "All Time Peak": ["2", "7[2]", None, "10[9]"],
        "Actual gross": ["$780,000,000", "$579,800,000", "$411,000,000", "N/A"],
        "Adjusted gross (in 2022 dollars)": ["$780,000,000", "$579,800,000", "$560,622,615", "-"],
        "Artist": ["Taylor Swift", "Beyoncé", "Madonna", "Pink"],
        "Tour title": ["The Eras Tour †", "Renaissance World Tour", "Sticky & Sweet Tour ‡[4][a]", "Beautiful Trauma World Tour"],
        "Year(s)": ["2023–2024", "2023", "2008–2009", "2018–2019"],
        "Shows": ["56", "56", "85", "156"],
        "Average gross": ["$13,928,571", "$10,353,571", "$4,835,294", "$2,546,795"],
        "Ref.": ["[1]", "[3]", "[6]", "[7]"],
    }
    raw_df = pd.DataFrame(raw_data)

    transformer = DataTransformer()
    clean_df = transformer.transform(raw_df, source_file="gs://sdlc-workspec-store/etl/data/my_file (1).csv")

    assert len(clean_df) == 4
    # Rank check
    assert clean_df.iloc[0]["rank"] == 1
    assert clean_df.iloc[1]["rank"] == 2

    # Peak check (footnote stripped)
    assert clean_df.iloc[1]["peak"] == 1
    assert clean_df.iloc[2]["peak"] == 2
    assert pd.isna(clean_df.iloc[3]["peak"])

    # Actual gross check (currency & commas stripped)
    assert clean_df.iloc[0]["actual_gross"] == 780000000
    assert clean_df.iloc[1]["actual_gross"] == 579800000
    assert pd.isna(clean_df.iloc[3]["actual_gross"])

    # Artist and Tour Title check
    assert clean_df.iloc[0]["artist"] == "Taylor Swift"
    assert clean_df.iloc[1]["artist"] == "Beyoncé"

    # Year(s) check
    assert clean_df.iloc[0]["years"] == "2023–2024"

    # Audit columns
    assert "_etl_loaded_at" in clean_df.columns
    assert "_source_file" in clean_df.columns
    assert clean_df.iloc[0]["_source_file"] == "gs://sdlc-workspec-store/etl/data/my_file (1).csv"


@pytest.mark.skipif(not HAS_PANDAS, reason="pandas is required for transformation tests")
def test_data_transformer_empty_df():
    """Tests DataTransformer on an empty DataFrame."""
    from pipeline.transformer import DataTransformer

    transformer = DataTransformer()
    empty_df = pd.DataFrame()
    clean_df = transformer.transform(empty_df)
    assert clean_df.empty
    assert "rank" in clean_df.columns
    assert "_etl_loaded_at" in clean_df.columns


@pytest.mark.skipif(not HAS_PANDAS, reason="pandas is required for extractor tests")
def test_gcs_extractor_local_file(tmp_path):
    """Tests GCSExtractor with a local CSV file."""
    from pipeline.extractor import GCSExtractor

    csv_file = tmp_path / "test_tours.csv"
    csv_file.write_text("Rank,Artist,Shows\n1,Taylor Swift,56\n2,Beyoncé,56\n", encoding="utf-8")

    extractor = GCSExtractor(project_id="upbeat-repeater-477110-q6")
    df = extractor.extract(str(csv_file))
    assert len(df) == 2
    assert "Artist" in df.columns


@pytest.mark.skipif(not HAS_PANDAS, reason="pandas is required for loader tests")
def test_bigquery_loader(monkeypatch):
    """Tests BigQueryLoader dataset/table validation and data loading."""
    mock_client = MagicMock()
    mock_client.get_dataset.side_effect = Exception("Not found")
    mock_client.get_table.side_effect = [Exception("Not found"), MagicMock(num_rows=2)]
    mock_job = MagicMock()
    mock_client.load_table_from_dataframe.return_value = mock_job

    loader = BigQueryLoader(
        project_id="upbeat-repeater-477110-q6",
        dataset_id="analytics",
        table_id="test01",
        client=mock_client,
    )

    df = pd.DataFrame({
        "rank": [1, 2],
        "artist": ["Taylor Swift", "Beyoncé"],
        "_etl_loaded_at": pd.to_datetime(["2026-01-01", "2026-01-02"], utc=True),
        "_source_file": ["gs://bucket/file.csv", "gs://bucket/file.csv"],
    })

    rows_loaded = loader.load(df)
    assert rows_loaded == 2
    assert mock_client.create_dataset.called
    assert mock_client.create_table.called
    assert mock_client.load_table_from_dataframe.called


@pytest.mark.skipif(not HAS_PANDAS, reason="pandas is required for end to end tests")
def test_run_etl_end_to_end(tmp_path):
    """Tests run_etl function end to end with mock dependencies."""
    from server.main import run_etl

    csv_file = tmp_path / "sample_tours.csv"
    csv_file.write_text(
        "Rank,Peak,All Time Peak,Actual gross,Adjusted gross (in 2022 dollars),Artist,Tour title,Year(s),Shows,Average gross,Ref.\n"
        "1,1,2,$780,000,000,$780,000,000,Taylor Swift,The Eras Tour †,2023–2024,56,$13,928,571,[1]\n",
        encoding="utf-8",
    )

    with patch("pipeline.loader.BigQueryLoader.load", return_value=1):
        summary = run_etl(
            source_uri=str(csv_file),
            project_id="upbeat-repeater-477110-q6",
            dataset_id="analytics",
            table_id="test01",
            write_disposition="WRITE_TRUNCATE",
        )
        assert summary["status"] == "SUCCESS"
        assert summary["rows_extracted"] == 1
        assert summary["rows_cleaned"] == 1
        assert summary["rows_quarantined"] == 0
        assert summary["rows_loaded"] == 1
