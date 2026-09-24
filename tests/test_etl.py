"""Unit and integration tests for ETL pipeline components."""
import os
import ast
import json
import pytest

def test_dag_and_runner_syntax():
    """Verifies that all pipeline and server Python files parse without syntax errors."""
    python_files = [
        os.path.join("pipeline", "run_etl.py"),
        os.path.join("app.py"),
        os.path.join("server", "etl", "extractor.py"),
        os.path.join("server", "etl", "validator.py"),
        os.path.join("server", "etl", "transformer.py"),
        os.path.join("server", "etl", "loader.py"),
    ]
    for filepath in python_files:
        assert os.path.isfile(filepath), f"File missing: {filepath}"
        with open(filepath, "r", encoding="utf-8") as f:
            code = f.read()
        tree = ast.parse(code)
        assert tree is not None, f"Failed to parse AST for {filepath}"


def test_schema_definition():
    """Verifies BigQuery schema file contains mandatory fields and valid types."""
    schema_path = os.path.join("schemas", "test02_schema.json")
    assert os.path.isfile(schema_path), f"Schema file missing: {schema_path}"
    with open(schema_path, "r", encoding="utf-8") as f:
        schema = json.load(f)

    field_names = [field["name"] for field in schema]
    assert "Rank" in field_names
    assert "Artist" in field_names
    assert "Tour_title" in field_names
    assert "Actual_gross" in field_names
    assert "_etl_loaded_at" in field_names


def test_transformation_spec_mapping():
    """Verifies transformation specification contains required source-to-target mappings and sort config."""
    spec_path = "transformation_spec.json"
    assert os.path.isfile(spec_path), f"Transformation spec missing: {spec_path}"
    with open(spec_path, "r", encoding="utf-8") as f:
        spec = json.load(f)

    mappings = spec.get("source_to_target_mappings", [])
    target_cols = [m.get("target_column") for m in mappings]
    assert "Rank" in target_cols
    assert "Artist" in target_cols
    assert "Actual_gross" in target_cols

    sort_by = spec.get("sort_by", [])
    assert len(sort_by) > 0
    assert sort_by[0]["column"] == "Rank"
    assert sort_by[0]["order"] == "ASC"


def test_transformer_logic_with_pandas():
    """Tests transformation and sorting logic when pandas is installed."""
    pd = pytest.importorskip("pandas")
    from server.etl.transformer import TourDataTransformer
    from server.etl.validator import DataValidator

    data = {
        "Rank": ["3", "1", "2", "4"],
        "Peak": ["1", "1[4]", "2[7]", None],
        "All Time Peak": ["2", "7[2]", "2[5]", "10"],
        "Actual gross": ["$411,000,000", "$780,000,000", "$579,800,000", "$397,300,000"],
        "Adjusted gross (in 2022 dollars)": ["$560,622,615", "$780,000,000", "$579,800,000", "$454,751,555"],
        "Artist": ["Madonna  ", " Taylor Swift", "Beyonce", "Pink "],
        "Tour title": ["Sticky & Sweet Tour \u2021[4][a]", "The Eras Tour \u2020", "Renaissance World Tour", "Beautiful Trauma"],
        "Year(s)": ["2008-2009", "2023-2024", "2023", "2018-2019"],
        "Shows": ["85", "56", "56", "156"],
        "Average gross": ["$4,835,294", "$13,928,571", "$10,353,571", "$2,546,795"],
        "Ref.": ["[6]", "[1]", "[3]", "[7]"],
    }
    df = pd.DataFrame(data)

    validator = DataValidator(required_columns=["Rank"])
    assert validator.validate_raw(df) is True

    transformer = TourDataTransformer(source_file_uri="gs://sdlc-workspec-store/etl/data/my_file (1).csv")
    df_transformed = transformer.transform(df)

    # Validate sorting: ranks should be [1, 2, 3, 4] in ascending order
    assert list(df_transformed["Rank"]) == [1, 2, 3, 4]
    assert df_transformed.iloc[0]["Artist"] == "Taylor Swift"
    assert df_transformed.iloc[1]["Artist"] == "Beyonce"
    assert df_transformed.iloc[2]["Artist"] == "Madonna"
    assert df_transformed.iloc[3]["Artist"] == "Pink"

    # Peak stripping: '1[4]' -> 1, '2[7]' -> 2
    assert df_transformed[df_transformed["Artist"] == "Taylor Swift"]["Peak"].values[0] == 1
    assert df_transformed[df_transformed["Artist"] == "Beyonce"]["Peak"].values[0] == 2

    # Currency conversion
    assert df_transformed[df_transformed["Artist"] == "Taylor Swift"]["Actual_gross"].values[0] == 780000000

    # Lineage tracking
    assert (df_transformed["_source_file"] == "gs://sdlc-workspec-store/etl/data/my_file (1).csv").all()
    assert validator.validate_transformed(df_transformed) is True
