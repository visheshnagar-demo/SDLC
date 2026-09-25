"""Unit tests for RankSortTransformer."""
import pytest
from server.compat import pd
from server.transformer import (
    RankSortTransformer,
    clean_column_name,
    clean_numeric_value,
    clean_string_value
)


def test_clean_column_name():
    """Test column name normalization and sanitization."""
    assert clean_column_name("Rank") == "rank"
    assert clean_column_name("Peak") == "peak"
    assert clean_column_name("All Time Peak") == "all_time_peak"
    assert clean_column_name("Actual\u00a0gross") == "actual_gross"
    assert clean_column_name("Adjusted\u00a0gross (in 2022 dollars)") == "adjusted_gross"
    assert clean_column_name("Year(s)") == "years"
    assert clean_column_name("Ref.") == "ref"


def test_clean_numeric_value():
    """Test numeric and currency cleansing."""
    assert clean_numeric_value("1") == 1
    assert clean_numeric_value("1[4]") == 1
    assert clean_numeric_value("10[7]") == 10
    assert clean_numeric_value("$780,000,000") == 780000000
    assert clean_numeric_value("$13,928,571") == 13928571
    assert clean_numeric_value(None) is None
    assert clean_numeric_value("") is None
    assert clean_numeric_value("N/A") is None
    assert clean_numeric_value("-") is None


def test_clean_string_value():
    """Test string whitespace stripping."""
    assert clean_string_value("  Taylor Swift  ") == "Taylor Swift"
    assert clean_string_value("") is None
    assert clean_string_value("null") is None


def test_transformer_ordering_and_schema():
    """Test end-to-end transformation, sorting, and schema mapping."""
    raw_data = {
        "Rank": ["3", "1", "2", None],
        "Peak": ["2[4]", "1", "1[4]", "-"],
        "All Time Peak": ["10[9]", "2", "7[2]", None],
        "Actual\u00a0gross": ["$411,000,000", "$780,000,000", "$579,800,000", "$100,000,000"],
        "Adjusted\u00a0gross (in 2022 dollars)": ["$560,622,615", "$780,000,000", "$579,800,000", "$100,000,000"],
        "Artist": ["Madonna", "Taylor Swift", "Beyoncé", "Unknown"],
        "Tour title": ["Sticky & Sweet Tour", "The Eras Tour", "Renaissance World Tour", "Test Tour"],
        "Year(s)": ["2008–2009", "2023–2024", "2023", "2020"],
        "Shows": ["85", "56", "56", "10"],
        "Average gross": ["$4,835,294", "$13,928,571", "$10,353,571", "$1,000,000"],
        "Ref.": ["[6]", "[1]", "[3]", None]
    }
    df_raw = pd.DataFrame(raw_data)

    transformer = RankSortTransformer()
    df_transformed, summary = transformer.transform(df_raw)

    # Validate row count
    assert len(df_transformed) == 4
    assert summary.transformed_row_count == 4
    assert summary.null_ranks_count == 1

    # Validate rank ascending ordering: 1, 2, 3, <NA>
    assert df_transformed.iloc[0]["rank"] == 1
    assert df_transformed.iloc[0]["artist"] == "Taylor Swift"
    assert df_transformed.iloc[0]["actual_gross"] == 780000000

    assert df_transformed.iloc[1]["rank"] == 2
    assert df_transformed.iloc[1]["artist"] == "Beyoncé"

    assert df_transformed.iloc[2]["rank"] == 3
    assert df_transformed.iloc[2]["artist"] == "Madonna"
    assert df_transformed.iloc[2]["peak"] == 2

    # Null rank positioned last - use pd.isna per mandatory rule
    assert pd.isna(df_transformed.iloc[3]["rank"])
    assert df_transformed.iloc[3]["artist"] == "Unknown"

    # Validate audit column
    assert "_ingested_at" in df_transformed.columns


def test_transformer_missing_rank_raises():
    """Test transformer raises KeyError if required rank column is missing."""
    df_no_rank = pd.DataFrame({"Artist": ["Artist A"], "Shows": ["10"]})
    transformer = RankSortTransformer()

    with pytest.raises(KeyError) as exc_info:
        transformer.transform(df_no_rank)
    assert "Missing required 'rank' column" in str(exc_info.value)
