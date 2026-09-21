"""Unit tests for DataTransformer."""
import pytest

pd = pytest.importorskip("pandas")
from server.pipeline.config import PipelineConfig
from server.pipeline.transformer import DataTransformer


def test_clean_numeric_string():
    assert DataTransformer.clean_numeric_string("1") == 1
    assert DataTransformer.clean_numeric_string("1[4]") == 1
    assert DataTransformer.clean_numeric_string("$780,000,000") == 780000000
    assert DataTransformer.clean_numeric_string("$13,928,571") == 13928571
    assert DataTransformer.clean_numeric_string("N/A") is None
    assert DataTransformer.clean_numeric_string(None) is None


def test_clean_text_string():
    assert DataTransformer.clean_text_string("  Taylor Swift  ") == "Taylor Swift"
    assert DataTransformer.clean_text_string("N/A") is None
    assert DataTransformer.clean_text_string("") is None
    assert DataTransformer.clean_text_string("null") is None


def test_transform_full_dataframe():
    cfg = PipelineConfig(
        gcp_project_id="upbeat-repeater-477110-q6",
        bq_dataset="analytics",
        bq_table="test2",
        gcs_source_bucket="sdlc-workspec-store",
        gcs_source_prefix="etl/data/my_file (1).csv",
    )
    transformer = DataTransformer(cfg)

    raw_df = pd.DataFrame(
        {
            "Rank": ["1", "2"],
            "Peak": ["1", "1[4]"],
            "All Time Peak": ["2", "7[2]"],
            "Actual\u00a0gross": ["$780,000,000", "$579,800,000"],
            "Adjusted\u00a0gross (in 2022 dollars)": ["$780,000,000", "$579,800,000"],
            "Artist": ["Taylor Swift", "Beyoncé"],
            "Tour title": ["The Eras Tour †", "Renaissance World Tour"],
            "Year(s)": ["2023–2024", "2023"],
            "Shows": ["56", "56"],
            "Average gross": ["$13,928,571", "$10,353,571"],
            "Ref.": ["[1]", "[3]"],
        }
    )

    transformed_df = transformer.transform(raw_df)

    assert len(transformed_df) == 2
    assert transformed_df["rank"].iloc[0] == 1
    assert transformed_df["peak"].iloc[1] == 1
    assert transformed_df["all_time_peak"].iloc[1] == 7
    assert transformed_df["actual_gross"].iloc[0] == 780000000
    assert transformed_df["adjusted_gross_in_2022_dollars"].iloc[0] == 780000000
    assert transformed_df["shows"].iloc[0] == 56
    assert transformed_df["average_gross"].iloc[0] == 13928571
    assert transformed_df["artist"].iloc[0] == "Taylor Swift"
    assert transformed_df["years"].iloc[0] == "2023–2024"
    assert "_ingested_at" in transformed_df.columns
    assert "_source_file" in transformed_df.columns
    assert "_pipeline_version" in transformed_df.columns
