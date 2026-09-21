"""Unit tests for SchemaEngine."""
import pytest

pd = pytest.importorskip("pandas")
from server.pipeline.schema_engine import SchemaEngine


def test_sanitize_column_name():
    assert SchemaEngine.sanitize_column_name("Rank") == "rank"
    assert SchemaEngine.sanitize_column_name("All Time Peak") == "all_time_peak"
    assert SchemaEngine.sanitize_column_name("Actual\u00a0gross") == "actual_gross"
    assert (
        SchemaEngine.sanitize_column_name("Adjusted\u00a0gross (in 2022 dollars)")
        == "adjusted_gross_in_2022_dollars"
    )
    assert SchemaEngine.sanitize_column_name("Year(s)") == "years"
    assert SchemaEngine.sanitize_column_name("Ref.") == "ref"


def test_sanitize_headers():
    df = pd.DataFrame(
        {
            "Rank": [1],
            "All Time Peak": [2],
            "Actual\u00a0gross": ["$100"],
            "Year(s)": ["2023"],
            "Ref.": ["[1]"],
        }
    )
    sanitized_df = SchemaEngine.sanitize_headers(df)
    expected_cols = ["rank", "all_time_peak", "actual_gross", "years", "ref"]
    assert list(sanitized_df.columns) == expected_cols


def test_get_column_type_map():
    type_map = SchemaEngine.get_column_type_map()
    assert type_map["rank"] == "INTEGER"
    assert type_map["artist"] == "STRING"
    assert type_map["_ingested_at"] == "TIMESTAMP"
