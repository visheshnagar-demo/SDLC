"""Unit tests for ETL pipeline components (SCRUM-386)."""
import os
import unittest
from unittest.mock import MagicMock, patch
import pytest

try:
    import pandas as pd
    import numpy as np
except ImportError:
    pd = None
    np = None

from server.etl.config import ETLConfig


class TestETLConfig(unittest.TestCase):
    """Tests for ETLConfig."""

    def test_default_config_loading(self):
        with patch.dict(os.environ, {
            "GCP_PROJECT_ID": "test-project",
            "INSTANCE_CONNECTION_NAME": "test-project:us-central1:test-db",
            "POSTGRES_DB": "test_db",
            "POSTGRES_USER": "test-sa@developer",
            "POSTGRES_TABLE": "test_data",
            "CLOUD_SQL_IP_TYPE": "PRIVATE",
            "BIGQUERY_DATASET": "analytics",
            "BIGQUERY_TABLE": "postgres_test4",
        }):
            config = ETLConfig.from_env()
            self.assertEqual(config.gcp_project_id, "test-project")
            self.assertEqual(config.instance_connection_name, "test-project:us-central1:test-db")
            self.assertEqual(config.postgres_db, "test_db")
            self.assertEqual(config.postgres_user, "test-sa@developer")
            self.assertEqual(config.postgres_table, "test_data")
            self.assertEqual(config.cloud_sql_ip_type, "PRIVATE")
            self.assertEqual(config.bq_dataset, "analytics")
            self.assertEqual(config.bq_table, "postgres_test4")


class TestDataTransformer(unittest.TestCase):
    """Tests for DataTransformer cleaning, normalization, and deduplication."""

    def setUp(self):
        self.config = ETLConfig(
            gcp_project_id="test-project",
            instance_connection_name="test-project:us-central1:test-db",
            postgres_db="postgres",
            postgres_user="test-sa@developer",
            postgres_table="test_data",
            cloud_sql_ip_type="PRIVATE",
            postgres_port="5432",
            database_url="",
            bq_dataset="analytics",
            bq_table="postgres_test4",
            bq_location="us-central1",
            write_disposition="WRITE_APPEND",
        )
        if pd is not None:
            from server.etl.transformer import DataTransformer
            self.transformer = DataTransformer(self.config)
        else:
            self.transformer = None

    def test_whitespace_and_null_sanitization(self):
        if pd is None:
            self.skipTest("pandas not installed")
        raw_data = {
            "id": [" 1 ", "2", "3", "4"],
            "name": [" Alice  ", "  Bob ", "null", "N/A"],
            "created_at": ["2026-01-01 10:00:00", "2026-01-02 11:00:00", "", None],
        }
        df = pd.DataFrame(raw_data)
        cleaned = self.transformer.transform(df)

        self.assertEqual(len(cleaned), 4)
        self.assertEqual(cleaned.iloc[0]["id"], "1")
        self.assertEqual(cleaned.iloc[0]["name"], "Alice")
        self.assertEqual(cleaned.iloc[1]["name"], "Bob")
        # Assert nulls using pd.isna per mandatory guidelines
        self.assertTrue(pd.isna(cleaned.iloc[2]["name"]))
        self.assertTrue(pd.isna(cleaned.iloc[3]["name"]))
        self.assertIn("_etl_loaded_at", cleaned.columns)
        self.assertIn("_etl_source_table", cleaned.columns)
        self.assertEqual(cleaned.iloc[0]["_etl_source_table"], "postgres.test_data")

    def test_deduplication(self):
        if pd is None:
            self.skipTest("pandas not installed")
        raw_data = {
            "id": ["1", "1", "2"],
            "name": ["Alice", "Alice", "Bob"],
            "created_at": ["2026-01-01", "2026-01-01", "2026-01-02"],
        }
        df = pd.DataFrame(raw_data)
        cleaned = self.transformer.transform(df)
        self.assertEqual(len(cleaned), 2)

    def test_circuit_breaker_on_all_invalid(self):
        if pd is None:
            self.skipTest("pandas not installed")
        raw_data = {
            "id": [None, None],
            "name": ["", "null"],
            "created_at": ["", "N/A"],
        }
        df = pd.DataFrame(raw_data)
        with self.assertRaises(RuntimeError):
            self.transformer.transform(df)

    def test_empty_dataframe_handling(self):
        if pd is None:
            self.skipTest("pandas not installed")
        df = pd.DataFrame()
        cleaned = self.transformer.transform(df)
        self.assertTrue(cleaned.empty)
