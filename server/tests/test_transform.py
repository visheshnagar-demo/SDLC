"""Unit tests for data transformation and cleaning module."""

import pytest
from server.pipeline.transform import sanitize_column_name, transform_data


def test_sanitize_column_names():
    """Test standard and edge-case header sanitization."""
    assert sanitize_column_name("Rank") == "rank"
    assert sanitize_column_name("Peak") == "peak"
    assert sanitize_column_name("All Time Peak") == "all_time_peak"
    assert sanitize_column_name("Actual\u00a0gross") == "actual_gross"
    assert sanitize_column_name("Adjusted\u00a0gross (in 2022 dollars)") == "adjusted_gross_in_2022_dollars"
    assert sanitize_column_name("Artist") == "artist"
    assert sanitize_column_name("Tour title") == "tour_title"
    assert sanitize_column_name("Year(s)") == "years"
    assert sanitize_column_name("Shows") == "shows"
    assert sanitize_column_name("Average gross") == "average_gross"
    assert sanitize_column_name("Ref.") == "ref"


def test_transform_data_happy_path():
    """Test end-to-end transformation of sample raw records."""
    raw_data = [
        {
            "Rank": "1",
            "Peak": "1",
            "All Time Peak": "1",
            "Actual\u00a0gross": "$780,000,000",
            "Adjusted\u00a0gross (in 2022 dollars)": "$780,000,000",
            "Artist": "Taylor Swift",
            "Tour title": "The Eras Tour †",
            "Year(s)": "2023–2024",
            "Shows": "56",
            "Average gross": "$13,928,571",
            "Ref.": "[1]",
        },
        {
            "Rank": "2",
            "Peak": "1",
            "All Time Peak": "7[2]",
            "Actual\u00a0gross": "$579,800,000",
            "Adjusted\u00a0gross (in 2022 dollars)": "$579,800,000",
            "Artist": "Beyoncé",
            "Tour title": "Renaissance World Tour",
            "Year(s)": "2023",
            "Shows": "56",
            "Average gross": "$10,353,571",
            "Ref.": "[3]",
        },
    ]

    clean_data = transform_data(raw_data)

    assert len(clean_data) == 2
    first = clean_data[0] if isinstance(clean_data, list) else clean_data.iloc[0].to_dict()
    assert first["rank"] == 1
    assert first["shows"] == 56
    assert first["artist"] == "Taylor Swift"
    assert first["years"] == "2023–2024"
    assert first["ref"] == "[1]"
    assert "_etl_loaded_at" in first


def test_transform_data_null_normalization():
    """Test normalization of various null strings."""
    raw_data = [
        {
            "Rank": "1",
            "Artist": "Taylor Swift",
            "Tour title": "The Eras Tour",
            "All Time Peak": "N/A",
            "Shows": "10",
        },
        {
            "Rank": None,
            "Artist": "Madonna",
            "Tour title": "Sticky & Sweet",
            "All Time Peak": "null",
            "Shows": "",
        },
    ]

    clean_data = transform_data(raw_data)
    second = clean_data[1] if isinstance(clean_data, list) else clean_data.iloc[1].to_dict()
    assert second["all_time_peak"] is None
    assert second["shows"] is None


def test_transform_empty_data_raises():
    """Test that empty data raises RuntimeError."""
    with pytest.raises(RuntimeError, match="contains 0 records"):
        transform_data([])


def test_circuit_breaker_triggered():
    """Test circuit breaker when invalid records exceed threshold."""
    corrupted_data = [
        {"Rank": "1", "Artist": None, "Tour title": None},
        {"Rank": "2", "Artist": None, "Tour title": None},
    ]
    with pytest.raises(RuntimeError, match="Circuit breaker triggered"):
        transform_data(corrupted_data, max_error_ratio=0.0)
