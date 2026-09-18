"""Unit tests for DataTransformer module."""
import pytest
pd = pytest.importorskip("pandas")
from pipeline.transformer import DataTransformer


def test_clean_column_names():
    df = pd.DataFrame({
        "Rank": [1],
        "Actual\u00a0gross": ["$780,000,000"],
        "Adjusted\u00a0gross (in 2022 dollars)": ["$780,000,000"],
        "Year(s)": ["2023–2024"],
        "Ref.": ["[1]"]
    })
    cleaned_df = DataTransformer.clean_column_names(df)
    assert "rank" in cleaned_df.columns
    assert "actual_gross" in cleaned_df.columns
    assert "adjusted_gross_in_2022_dollars" in cleaned_df.columns
    assert "year_s" in cleaned_df.columns
    assert "ref" in cleaned_df.columns


def test_clean_numeric_value_with_footnotes_and_currency():
    assert DataTransformer.clean_numeric_value("$780,000,000") == 780000000
    assert DataTransformer.clean_numeric_value("1[4]") == 1
    assert DataTransformer.clean_numeric_value("7[2]") == 7
    assert DataTransformer.clean_numeric_value("$13,928,571") == 13928571
    assert DataTransformer.clean_numeric_value(None) is None
    assert DataTransformer.clean_numeric_value("nan") is None
    assert DataTransformer.clean_numeric_value("") is None


def test_clean_string_value():
    assert DataTransformer.clean_string_value("  Taylor Swift  ") == "Taylor Swift"
    assert DataTransformer.clean_string_value("nan") is None
    assert DataTransformer.clean_string_value(None) is None


def test_transform_full_dataframe():
    raw_data = {
        "Rank": [1, 2],
        "Peak": ["1", "1[4]"],
        "All Time Peak": ["2", "7[2]"],
        "Actual\u00a0gross": ["$780,000,000", "$579,800,000"],
        "Adjusted\u00a0gross (in 2022 dollars)": ["$780,000,000", "$579,800,000"],
        "Artist": ["Taylor Swift", "Beyoncé"],
        "Tour title": ["The Eras Tour †", "Renaissance World Tour"],
        "Year(s)": ["2023–2024", "2023"],
        "Shows": ["56", "56"],
        "Average gross": ["$13,928,571", "$10,353,571"],
        "Ref.": ["[1]", "[3]"]
    }
    df = pd.DataFrame(raw_data)
    transformer = DataTransformer()
    result = transformer.transform(df, source_file="gs://sdlc-workspec-store/etl/data/my_file (1).csv")

    assert len(result) == 2
    assert result["rank"].iloc[0] == 1
    assert result["peak"].iloc[1] == 1
    assert result["all_time_peak"].iloc[1] == 7
    assert result["actual_gross"].iloc[0] == 780000000
    assert result["shows"].iloc[0] == 56
    assert result["average_gross"].iloc[1] == 10353571
    assert "ingested_at" in result.columns
    assert "_source_file" in result.columns
