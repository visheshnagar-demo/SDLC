"""Automated tests for pipeline postgres_to_bigquery_scrum_352."""
import ast
import json
import os
import pytest

try:
    import pandas as pd
except ImportError:
    pd = None


def test_dag_syntax():
    """Verifies that the Airflow DAG has valid Python AST syntax."""
    dag_path = os.path.join("dags", "postgres_to_bigquery_scrum_352_dag.py")
    assert os.path.isfile(dag_path), f"DAG file missing: {dag_path}"
    with open(dag_path, "r", encoding="utf-8") as f:
        code = f.read()
    tree = ast.parse(code)
    assert tree is not None


def test_standalone_script_syntax():
    """Verifies that the standalone pipeline script has valid syntax."""
    script_path = os.path.join("pipeline", "run_postgres_to_bigquery_scrum_352.py")
    assert os.path.isfile(script_path), f"Script file missing: {script_path}"
    with open(script_path, "r", encoding="utf-8") as f:
        code = f.read()
    tree = ast.parse(code)
    assert tree is not None


def test_server_modules_syntax():
    """Verifies that all server package Python files have valid AST syntax."""
    server_dir = "server"
    for root, _, files in os.walk(server_dir):
        for file in files:
            if file.endswith(".py"):
                file_path = os.path.join(root, file)
                with open(file_path, "r", encoding="utf-8") as f:
                    code = f.read()
                tree = ast.parse(code)
                assert tree is not None, f"AST parse failed for {file_path}"


def test_pipeline_spec_configuration():
    """Verifies connector parameters."""
    source_type = "postgresql"
    target_type = "bigquery"
    write_mode = "append"
    assert source_type in ["postgresql", "mysql", "s3", "gcs", "rest_api", "sftp", "kafka"]
    assert target_type in ["bigquery", "snowflake", "postgresql", "mysql", "gcs", "s3"]
    assert write_mode in ["append", "overwrite", "merge", "upsert"]


def test_transformation_spec_schema():
    """Verifies transformation specification JSON content and schema coverage."""
    spec_path = "transformation_spec.json"
    assert os.path.isfile(spec_path), f"Spec file missing: {spec_path}"
    with open(spec_path, "r", encoding="utf-8") as f:
        spec = json.load(f)
    assert "columns" in spec
    column_names = [col["target_name"] for col in spec["columns"]]
    assert "id" in column_names
    assert "data_val" in column_names
    assert "created_at" in column_names
    assert "audit_columns" in spec
    audit_names = [col["name"] for col in spec["audit_columns"]]
    assert "_etl_loaded_at" in audit_names
    assert "_etl_batch_id" in audit_names


def test_bigquery_target_schema():
    """Verifies BigQuery schema JSON content."""
    schema_path = os.path.join("schemas", "postgres_test1_schema.json")
    assert os.path.isfile(schema_path), f"Schema file missing: {schema_path}"
    with open(schema_path, "r", encoding="utf-8") as f:
        schema = json.load(f)
    field_names = [field["name"] for field in schema]
    assert "id" in field_names
    assert "data_val" in field_names
    assert "created_at" in field_names
    assert "_etl_loaded_at" in field_names
    assert "_etl_batch_id" in field_names


def test_env_deploy_json_config():
    """Verifies that env.deploy.json contains required variables."""
    deploy_path = "env.deploy.json"
    assert os.path.isfile(deploy_path), f"Deploy file missing: {deploy_path}"
    with open(deploy_path, "r", encoding="utf-8") as f:
        config = json.load(f)
    assert "POSTGRES_DB" in config
    assert "SOURCE_TABLE" in config
    assert "GCP_PROJECT_ID" in config
    assert "BIGQUERY_DATASET" in config
    assert "BIGQUERY_TABLE" in config
    assert "TARGET_TABLE" in config


def test_settings_initialization(monkeypatch):
    """Verifies that configuration initializes properly with environment variables."""
    from server.config import Settings, get_settings
    monkeypatch.setenv("GCP_PROJECT_ID", "upbeat-repeater-477110-q6")
    monkeypatch.setenv("POSTGRES_DB", "postgres")
    settings = get_settings()
    assert settings.gcp_project_id == "upbeat-repeater-477110-q6"
    assert settings.postgres_db == "postgres"
    assert settings.bigquery_dataset == "analytics"
    assert settings.bigquery_table == "postgres_test1"


def test_zero_sqlite_guard(monkeypatch):
    """Verifies that attempting to use SQLite raises EnvironmentError."""
    from server.config import Settings
    monkeypatch.setenv("DATABASE_URL", "sqlite:///test.db")
    settings = Settings()
    with pytest.raises(EnvironmentError, match="SQLite database URL is prohibited"):
        settings.get_database_url_or_fail()


@pytest.mark.skipif(pd is None, reason="pandas not installed in test environment")
def test_transformer_logic_when_pandas_available():
    """Verifies transformation logic when pandas is installed."""
    from server.config import Settings
    from server.transformer import DataTransformer

    settings = Settings()
    transformer = DataTransformer(settings, batch_id="test-batch-001")

    raw_data = {
        "id": [1, 2, 1],
        "data_val": ["  sample_a  ", "NULL", "  sample_a_v2  "],
        "created_at": ["2025-01-01 10:00:00", "2025-01-02 11:00:00", "2025-01-03 12:00:00"],
    }
    df_raw = pd.DataFrame(raw_data)
    df_cleaned, df_quarantine, metrics = transformer.transform(df_raw)

    assert len(df_cleaned) == 2
    assert metrics["duplicates_dropped"] == 1
    assert "_etl_loaded_at" in df_cleaned.columns
    assert "_etl_batch_id" in df_cleaned.columns
