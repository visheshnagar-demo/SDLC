"""Automated tests for GCS to BigQuery ETL pipeline (SCRUM-375)."""

import json
import os
import sys
import pytest

workspace_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if workspace_root not in sys.path:
    sys.path.insert(0, workspace_root)


def test_schema_json_validity():
    """Verifies target BigQuery schema JSON structure."""
    schema_path = os.path.join(workspace_root, "schemas", "test01_schema.json")
    assert os.path.isfile(schema_path)
    with open(schema_path, "r", encoding="utf-8") as f:
        schema = json.load(f)
    assert len(schema) >= 11
    col_names = [f["name"] for f in schema]
    assert "rank" in col_names
    assert "artist" in col_names
    assert "_etl_loaded_at" in col_names


def test_transformation_spec_validity():
    """Verifies transformation_spec.json structure."""
    spec_path = os.path.join(workspace_root, "transformation_spec.json")
    assert os.path.isfile(spec_path)
    with open(spec_path, "r", encoding="utf-8") as f:
        spec = json.load(f)
    assert "columns" in spec
    assert len(spec["columns"]) >= 5
