"""Unit and integration tests for PostgreSQL to BigQuery ETL pipeline."""
import ast
import json
import os
import unittest
from unittest.mock import MagicMock, patch

from config import PipelineConfig, get_config
from pipeline.observability import PipelineMetrics, setup_logger


class TestConfig(unittest.TestCase):
    def test_default_config(self):
        cfg = get_config()
        self.assertEqual(cfg.postgres_db, "postgres")
        self.assertEqual(cfg.bigquery_dataset, "analytics")
        self.assertEqual(cfg.bigquery_table, "postgres_test2")
        self.assertEqual(cfg.source_table, "test_data")
        self.assertEqual(cfg.cloud_sql_ip_type, "PRIVATE")
        self.assertIn("sdlc-etl-demo-db", cfg.instance_connection_name)


class TestObservability(unittest.TestCase):
    def test_metrics_finalization(self):
        metrics = PipelineMetrics(
            extracted_count=100,
            cleaned_count=98,
            failed_count=2,
            loaded_count=98,
        )
        res = metrics.finalize()
        self.assertEqual(res["extracted_count"], 100)
        self.assertEqual(res["cleaned_count"], 98)
        self.assertEqual(res["failed_count"], 2)
        self.assertEqual(res["loaded_count"], 98)
        self.assertGreaterEqual(res["execution_duration_sec"], 0)

    def test_logger_setup(self):
        logger = setup_logger("test_etl_logger")
        self.assertIsNotNone(logger)
        self.assertEqual(logger.name, "test_etl_logger")


class TestSchemaIntegrity(unittest.TestCase):
    def test_schema_json_validity(self):
        schema_file = "schemas/postgres_test2_schema.json"
        self.assertTrue(os.path.isfile(schema_file), f"Schema file not found: {schema_file}")
        with open(schema_file, "r", encoding="utf-8") as f:
            schema = json.load(f)
        self.assertTrue(isinstance(schema, list))
        field_names = [field["name"] for field in schema]
        self.assertIn("id", field_names)
        self.assertIn("data_payload", field_names)
        self.assertIn("_etl_loaded_at", field_names)
        self.assertIn("_etl_source_instance", field_names)

    def test_transformation_spec_validity(self):
        spec_file = "transformation_spec.json"
        self.assertTrue(os.path.isfile(spec_file), f"Spec file not found: {spec_file}")
        with open(spec_file, "r", encoding="utf-8") as f:
            spec = json.load(f)
        self.assertIn("source", spec)
        self.assertIn("target", spec)
        self.assertIn("transformations", spec)
        self.assertIn("columns", spec)
        cols = [c["target"] for c in spec["columns"]]
        self.assertIn("id", cols)
        self.assertIn("data_payload", cols)

    def test_env_deploy_json_validity(self):
        env_file = "env.deploy.json"
        self.assertTrue(os.path.isfile(env_file), f"Env deploy file not found: {env_file}")
        with open(env_file, "r", encoding="utf-8") as f:
            env_config = json.load(f)
        self.assertIn("INSTANCE_CONNECTION_NAME", env_config)
        self.assertIn("POSTGRES_DB", env_config)
        self.assertIn("POSTGRES_USER", env_config)
        self.assertIn("CLOUD_SQL_IP_TYPE", env_config)
        self.assertEqual(env_config["CLOUD_SQL_IP_TYPE"], "PRIVATE")
        self.assertNotIn("POSTGRES_PASSWORD", env_config)
        self.assertIn("failure_behavior", env_config)
        self.assertEqual(env_config["failure_behavior"], "fail_fast")


# Conditional Dataframe tests if pandas is available in the test environment
try:
    import pandas as pd
    HAS_PANDAS = True
except ImportError:
    HAS_PANDAS = False


if HAS_PANDAS:
    from pipeline.transformer import clean_dataframe
    from pipeline.loader import load_to_bigquery

    class TestTransformer(unittest.TestCase):
        def setUp(self):
            self.cfg = PipelineConfig()

        def test_clean_dataframe_basic(self):
            raw_data = {
                "id": [" 101 ", "102", " 103"],
                "data_payload": ["  test payload A  ", "test payload B", None],
                "created_at": ["2026-01-01 10:00:00", "2026-01-02 12:00:00", "2026-01-03 15:30:00"],
                "updated_at": ["2026-01-01 10:05:00", "2026-01-02 12:10:00", None],
            }
            raw_df = pd.DataFrame(raw_data)
            cleaned_df = clean_dataframe(raw_df, self.cfg)

            self.assertEqual(len(cleaned_df), 3)
            self.assertEqual(cleaned_df.iloc[0]["id"], "101")
            self.assertEqual(cleaned_df.iloc[0]["data_payload"], "test payload A")
            self.assertTrue(pd.isna(cleaned_df.iloc[2]["data_payload"]))
            self.assertIn("_etl_loaded_at", cleaned_df.columns)
            self.assertIn("_etl_source_instance", cleaned_df.columns)

        def test_clean_dataframe_deduplication(self):
            raw_data = {
                "id": ["101", "101", "102"],
                "data_payload": ["duplicate", "duplicate", "unique"],
                "created_at": ["2026-01-01", "2026-01-01", "2026-01-02"],
                "updated_at": ["2026-01-01", "2026-01-01", "2026-01-02"],
            }
            raw_df = pd.DataFrame(raw_data)
            cleaned_df = clean_dataframe(raw_df, self.cfg)

            self.assertEqual(len(cleaned_df), 2)

        def test_clean_dataframe_circuit_breaker(self):
            raw_data = {
                "id": [None, None],
                "data_payload": [None, None],
                "created_at": [None, None],
                "updated_at": [None, None],
            }
            raw_df = pd.DataFrame(raw_data)
            with self.assertRaises(ValueError):
                clean_dataframe(raw_df, self.cfg)

        def test_empty_dataframe(self):
            raw_df = pd.DataFrame()
            cleaned_df = clean_dataframe(raw_df, self.cfg)
            self.assertTrue(cleaned_df.empty)

    class TestLoader(unittest.TestCase):
        def setUp(self):
            self.cfg = PipelineConfig()

        @patch("google.cloud.bigquery.Client")
        def test_load_to_bigquery_success(self, mock_bq_client_cls):
            mock_client = MagicMock()
            mock_bq_client_cls.return_value = mock_client
            mock_job = MagicMock()
            mock_client.load_table_from_dataframe.return_value = mock_job

            df = pd.DataFrame({
                "id": ["1", "2"],
                "data_payload": ["sample A", "sample B"],
                "_etl_loaded_at": [pd.Timestamp.utcnow(), pd.Timestamp.utcnow()],
                "_etl_source_instance": ["sdlc-etl-demo-db", "sdlc-etl-demo-db"],
            })

            loaded_count = load_to_bigquery(df, self.cfg)
            self.assertEqual(loaded_count, 2)
            mock_client.load_table_from_dataframe.assert_called_once()
            mock_job.result.assert_called_once()

        def test_load_to_bigquery_empty(self):
            df = pd.DataFrame()
            loaded_count = load_to_bigquery(df, self.cfg)
            self.assertEqual(loaded_count, 0)


if __name__ == "__main__":
    unittest.main()
