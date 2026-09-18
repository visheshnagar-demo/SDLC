"""Integration and unit tests for SCRUM-322 ETL pipeline."""

from unittest.mock import MagicMock
import pytest
from server.pipeline.extract import extract_from_gcs
from server.pipeline.transform import transform_data
from server.pipeline.load import load_to_bigquery


SAMPLE_CSV_DATA = (
    "Rank,Peak,All Time Peak,Actual gross,Adjusted gross (in 2022 dollars),Artist,Tour title,Year(s),Shows,Average gross,Ref.\n"
    "1,1,1,$780000000,$780000000,Taylor Swift,The Eras Tour,2023-2024,56,$13928571,[1]\n"
    "2,1,7,579800000,579800000,Beyoncé,Renaissance World Tour,2023,56,$10353571,[3]\n"
)


def test_full_pipeline_flow(tmp_path):
    """Test entire pipeline end-to-end with mocked BigQuery load."""
    csv_file = tmp_path / "test_tour_data.csv"
    csv_file.write_text(SAMPLE_CSV_DATA, encoding="utf-8")

    # 1. Extract
    raw_data = extract_from_gcs(str(csv_file))
    assert len(raw_data) == 2

    # 2. Transform
    clean_data = transform_data(raw_data)
    assert len(clean_data) == 2
    first = clean_data[0] if isinstance(clean_data, list) else clean_data.iloc[0].to_dict()
    assert first["rank"] == 1
    assert first["artist"] == "Taylor Swift"
    assert first["shows"] == 56
    assert "_etl_loaded_at" in first

    # 3. Load with mock
    mock_bq = MagicMock()
    mock_job = MagicMock()
    mock_job.job_id = "job-scrum-322"
    mock_bq.load_table_from_dataframe.return_value = mock_job
    mock_bq.load_table_from_json.return_value = mock_job
    mock_table = MagicMock()
    mock_table.num_rows = 2
    mock_bq.get_table.return_value = mock_table

    result = load_to_bigquery(
        df=clean_data,
        project_id="upbeat-repeater-477110-q6",
        dataset_id="analytics",
        table_id="viswa",
        bq_client=mock_bq,
    )

    assert result["status"] == "SUCCESS"
    assert result["rows_loaded"] == 2
