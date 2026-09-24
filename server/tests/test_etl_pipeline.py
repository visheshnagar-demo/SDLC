"""Unit and integration tests for Server ETL pipeline."""
import os
import json
import pytest


def test_transformation_ordering_by_rank(tmp_path):
    """Verifies that the transformation engine cleanses and orders records by rank ascending."""
    pd = pytest.importorskip("pandas")
    from pipeline.run_test03_pipeline import PipelineRunner

    runner = PipelineRunner(execution_date="test_run")
    runner.staging_dir = str(tmp_path)
    runner.staging_file = os.path.join(runner.staging_dir, "data.parquet")

    # Synthetic raw data unordered with string noise
    raw_df = pd.DataFrame([
        {
            "Rank": "5",
            "Peak": "2",
            "All Time Peak": "10[7]",
            "Actual\u00a0gross": "$345,675,146",
            "Adjusted\u00a0gross (in 2022 dollars)": "$402,844,849",
            "Artist": " Taylor Swift ",
            "Tour title": "Reputation Stadium Tour",
            "Year(s)": "2018",
            "Shows": "53",
            "Average gross": "$6,522,173",
            "Ref.": "[8]"
        },
        {
            "Rank": "1",
            "Peak": "1",
            "All Time Peak": "2",
            "Actual\u00a0gross": "$780,000,000",
            "Adjusted\u00a0gross (in 2022 dollars)": "$780,000,000",
            "Artist": "Taylor Swift",
            "Tour title": "The Eras Tour \u2020",
            "Year(s)": "2023\u20132024",
            "Shows": "56",
            "Average gross": "$13,928,571",
            "Ref.": "[1]"
        },
        {
            "Rank": "3",
            "Peak": "1[4]",
            "All Time Peak": "2[5]",
            "Actual\u00a0gross": "$411,000,000",
            "Adjusted\u00a0gross (in 2022 dollars)": "$560,622,615",
            "Artist": "Madonna",
            "Tour title": "Sticky & Sweet Tour \u2021[4][a]",
            "Year(s)": "2008\u20132009",
            "Shows": "85",
            "Average gross": "$4,835,294",
            "Ref.": "[6]"
        }
    ])
    raw_df.to_parquet(runner.staging_file, index=False)

    count = runner.transform()
    assert count == 3

    transformed_df = pd.read_parquet(runner.staging_file)
    ranks = transformed_df["rank"].tolist()
    assert ranks == [1, 3, 5], f"Expected ranks [1, 3, 5], got {ranks}"
    assert transformed_df.iloc[0]["artist"] == "Taylor Swift"
    assert transformed_df.iloc[0]["years"] == "2023–2024"
    assert "ingested_at" in transformed_df.columns


def test_transformation_handles_null_ranks(tmp_path):
    """Verifies that records with unparseable/null ranks are placed at the end."""
    pd = pytest.importorskip("pandas")
    from pipeline.run_test03_pipeline import PipelineRunner

    runner = PipelineRunner(execution_date="test_run_nulls")
    runner.staging_dir = str(tmp_path)
    runner.staging_file = os.path.join(runner.staging_dir, "data.parquet")

    raw_df = pd.DataFrame([
        {
            "Rank": "N/A",
            "Artist": "Unknown Artist",
            "Shows": "10",
        },
        {
            "Rank": "2",
            "Artist": "Beyonc\u00e9",
            "Shows": "56",
        }
    ])
    raw_df.to_parquet(runner.staging_file, index=False)

    count = runner.transform()
    assert count == 2

    transformed_df = pd.read_parquet(runner.staging_file)
    assert transformed_df.iloc[0]["artist"] == "Beyoncé"
    assert transformed_df.iloc[0]["rank"] == 2
    assert pd.isna(transformed_df.iloc[1]["rank"])
