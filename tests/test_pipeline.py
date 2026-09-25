"""Integration tests for the complete ETL pipeline."""
from unittest.mock import MagicMock, patch
from server.compat import pd
from server.config import PipelineConfig
from server.pipeline import run_pipeline, parse_args


def test_pipeline_end_to_end(tmp_path):
    """Test full pipeline workflow with local file and mocked BigQuery loader."""
    # Create test CSV fixture with quoted currency strings
    csv_file = tmp_path / "tours.csv"
    csv_content = (
        'Rank,Peak,All Time Peak,Actual\u00a0gross,Adjusted\u00a0gross (in 2022 dollars),Artist,Tour title,Year(s),Shows,Average gross,Ref.\n'
        '2,1[4],7[2],"$579,800,000","$579,800,000",Beyoncé,Renaissance World Tour,2023,56,"$10,353,571",[3]\n'
        '1,1,2,"$780,000,000","$780,000,000",Taylor Swift,The Eras Tour †,2023–2024,56,"$13,928,571",[1]\n'
    )
    csv_file.write_text(csv_content, encoding="utf-8")

    config = PipelineConfig(
        source_gcs_uri=str(csv_file),
        project_id="upbeat-repeater-477110-q6",
        dataset_id="analytics",
        table_id="kttest04"
    )

    mock_bq_client = MagicMock()
    mock_job = MagicMock()
    mock_job.job_id = "test_pipeline_job"
    mock_bq_client.load_table_from_dataframe.return_value = mock_job
    mock_table = MagicMock()
    mock_table.num_rows = 2
    mock_bq_client.get_table.return_value = mock_table

    with patch("server.loader.BigQueryTargetLoader.client", new_callable=lambda: property(lambda self: mock_bq_client)):
        result = run_pipeline(config)

        assert result.status == "SUCCESS"
        assert result.extraction.raw_row_count == 2
        assert result.transformation.transformed_row_count == 2
        assert result.transformation.sorted_by == "rank"
        assert result.load.rows_loaded == 2
        assert result.load.job_id == "test_pipeline_job"

        # Verify BigQuery loader received sorted DataFrame
        loaded_df = mock_bq_client.load_table_from_dataframe.call_args[0][0]
        assert loaded_df.iloc[0]["rank"] == 1
        assert loaded_df.iloc[0]["artist"] == "Taylor Swift"
        assert loaded_df.iloc[1]["rank"] == 2
        assert loaded_df.iloc[1]["artist"] == "Beyoncé"


def test_parse_args(monkeypatch):
    """Test CLI argument parsing."""
    test_args = [
        "pipeline.py",
        "--source-gcs-uri", "gs://custom-bucket/data.csv",
        "--project-id", "my-project",
        "--dataset-id", "my_dataset",
        "--table-name", "my_table",
        "--write-disposition", "WRITE_APPEND"
    ]
    monkeypatch.setattr("sys.argv", test_args)
    config = parse_args()

    assert config.source_gcs_uri == "gs://custom-bucket/data.csv"
    assert config.project_id == "my-project"
    assert config.dataset_id == "my_dataset"
    assert config.table_id == "my_table"
    assert config.write_disposition == "WRITE_APPEND"
