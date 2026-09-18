"""End-to-end and component tests for PipelineRunner."""
import os
import json
from unittest.mock import patch
import pytest

def test_schema_json_validity():
    schema_path = os.path.join("schemas", "test1_schema.json")
    assert os.path.exists(schema_path), "Schema file missing"
    with open(schema_path, "r", encoding="utf-8") as f:
        schema = json.load(f)
    assert isinstance(schema, list)
    col_names = [col["name"] for col in schema]
    assert "rank" in col_names
    assert "actual_gross" in col_names
    assert "artist" in col_names


def test_transformation_spec_validity():
    spec_path = "transformation_spec.json"
    assert os.path.exists(spec_path), "transformation_spec.json missing"
    with open(spec_path, "r", encoding="utf-8") as f:
        spec = json.load(f)
    assert "columns" in spec
    assert len(spec["columns"]) >= 10


def test_pipeline_run_success():
    pytest.importorskip("pandas")
    from pipeline.run_test1_etl import PipelineRunner
    with patch.object(PipelineRunner, "extract", return_value=10), \
         patch.object(PipelineRunner, "transform", return_value=10), \
         patch.object(PipelineRunner, "load", return_value=True):

        runner = PipelineRunner(execution_date="2026-05-18")
        exit_code = runner.run()
        assert exit_code == 0


def test_pipeline_run_handles_failure():
    pytest.importorskip("pandas")
    from pipeline.run_test1_etl import PipelineRunner
    with patch.object(PipelineRunner, "extract", side_effect=RuntimeError("GCS connection timeout")):
        runner = PipelineRunner(execution_date="2026-05-18")
        with pytest.raises(RuntimeError, match="GCS connection timeout"):
            runner.run()
