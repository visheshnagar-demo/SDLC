"""Test Suite for Cloud SQL PostgreSQL to BigQuery ETL Pipeline."""
import os
import unittest
from unittest.mock import MagicMock, patch

try:
    import pandas as pd
    import numpy as np
except ImportError:
    pd = None
    np = None

from server.etl.cleaner import DataCleaner
from server.etl.extractor import PostgresExtractor
from server.etl.loader import BigQueryLoader
from server.etl.pipeline import ETLPipeline


class TestPostgresExtractor(unittest.TestCase):
    """Tests configuration and extraction initialization."""

    def test_extractor_missing_env_raises(self):
        with patch.dict(os.environ, {}, clear=True):
            with self.assertRaises(EnvironmentError):
                PostgresExtractor()

    def test_extractor_init_with_params(self):
        extractor = PostgresExtractor(
            instance_connection_name="proj:region:inst",
            db_name="postgres",
            db_user="sa@dev",
            ip_type="PRIVATE"
        )
        self.assertEqual(extractor.instance_connection_name, "proj:region:inst")
        self.assertEqual(extractor.db_name, "postgres")
        self.assertEqual(extractor.db_user, "sa@dev")
        self.assertEqual(extractor.ip_type_str, "PRIVATE")

    def test_extractor_missing_user_raises(self):
        with self.assertRaises(EnvironmentError):
            PostgresExtractor(instance_connection_name="p:r:i", db_name="db", db_user="")


class TestDataCleaner(unittest.TestCase):
    """Tests data cleaning, normalization, and deduplication logic."""

    def setUp(self):
        self.cleaner = DataCleaner(key_columns=["id"])

    def test_cleaner_none_input_raises(self):
        with self.assertRaises(ValueError):
            self.cleaner.clean(None)

    def test_cleaner_empty_or_mock(self):
        if pd is not None:
            df = pd.DataFrame(columns=["id", "data", "created_at"])
            cleaned = self.cleaner.clean(df)
            self.assertTrue(cleaned.empty)
            self.assertIn("_etl_loaded_at", cleaned.columns)
        else:
            mock_df = MagicMock()
            mock_df.empty = True
            mock_df.copy.return_value = mock_df
            mock_df.columns = ["id", "data", "created_at"]
            cleaned = self.cleaner.clean(mock_df)
            self.assertIsNotNone(cleaned)

    def test_cleaner_whitespace_and_null_normalization(self):
        if pd is None:
            self.skipTest("pandas not installed in current environment")

        data = {
            "id": [" 1 ", "2", " 3"],
            "data": [" valid string  ", "null", "N/A"],
            "created_at": ["2026-01-01 10:00:00", "2026-01-02 11:00:00", "invalid-date"]
        }
        df = pd.DataFrame(data)
        cleaned = self.cleaner.clean(df)

        # Verify whitespace trimming
        self.assertEqual(cleaned.iloc[0]["id"], "1")
        self.assertEqual(cleaned.iloc[0]["data"], "valid string")

        # Verify pseudo-null normalization (Mandatory Pandas Null Testing Rule)
        self.assertTrue(pd.isna(cleaned.iloc[1]["data"]))
        self.assertTrue(pd.isna(cleaned.iloc[2]["data"]))

        # Verify _etl_loaded_at injection
        self.assertIn("_etl_loaded_at", cleaned.columns)
        self.assertFalse(cleaned["_etl_loaded_at"].isnull().any())

    def test_cleaner_deduplication(self):
        if pd is None:
            self.skipTest("pandas not installed in current environment")

        data = {
            "id": ["1", "1", "2"],
            "data": ["first", "duplicate", "second"],
            "created_at": ["2026-01-01", "2026-01-01", "2026-01-02"]
        }
        df = pd.DataFrame(data)
        cleaned = self.cleaner.clean(df)

        self.assertEqual(len(cleaned), 2)
        self.assertEqual(cleaned.iloc[0]["data"], "first")
        self.assertEqual(cleaned.iloc[1]["data"], "second")


class TestBigQueryLoader(unittest.TestCase):
    """Tests BigQueryLoader initialization and execution with mocks."""

    def test_loader_missing_project_raises(self):
        with patch.dict(os.environ, {}, clear=True):
            with self.assertRaises(EnvironmentError):
                BigQueryLoader(project_id="")

    @patch("server.etl.loader.bigquery.Client")
    def test_loader_empty_df_skips(self, mock_bq_client_cls):
        loader = BigQueryLoader(project_id="test-proj", dataset_id="analytics", table_id="postgres_test1")
        if pd is not None:
            df_empty = pd.DataFrame()
        else:
            df_empty = MagicMock()
            df_empty.empty = True
            df_empty.__len__.return_value = 0
        loaded = loader.load(df_empty)
        self.assertEqual(loaded, 0)

    @patch("server.etl.loader.bigquery.Client")
    def test_loader_success(self, mock_bq_client_cls):
        mock_client = MagicMock()
        mock_bq_client_cls.return_value = mock_client
        mock_job = MagicMock()
        mock_client.load_table_from_dataframe.return_value = mock_job
        mock_table = MagicMock()
        mock_table.num_rows = 5
        mock_client.get_table.return_value = mock_table

        loader = BigQueryLoader(project_id="test-proj", dataset_id="analytics", table_id="postgres_test1")
        loader.client = mock_client

        if pd is not None:
            df = pd.DataFrame({"id": ["1", "2"], "data": ["a", "b"]})
        else:
            df = MagicMock()
            df.empty = False
            df.__len__.return_value = 2

        loaded = loader.load(df)
        self.assertEqual(loaded, 2)
        mock_client.load_table_from_dataframe.assert_called_once()
        mock_job.result.assert_called_once()


class TestETLPipeline(unittest.TestCase):
    """Tests end-to-end pipeline execution flow."""

    def test_pipeline_run_success(self):
        mock_extractor = MagicMock()
        if pd is not None:
            raw_df = pd.DataFrame({
                "id": ["1", " 2 ", "1"],
                "data": [" val1 ", "none", "dup"],
                "created_at": ["2026-01-01", "2026-01-02", "2026-01-01"]
            })
            mock_extractor.extract.return_value = raw_df
            cleaner = DataCleaner(key_columns=["id"])
        else:
            raw_df = MagicMock()
            raw_df.__len__.return_value = 3
            mock_extractor.extract.return_value = raw_df
            clean_df = MagicMock()
            clean_df.__len__.return_value = 2
            cleaner = MagicMock()
            cleaner.clean.return_value = clean_df

        mock_loader = MagicMock()
        mock_loader.dataset_id = "analytics"
        mock_loader.table_id = "postgres_test1"
        mock_loader.load.side_effect = lambda df: len(df)

        pipeline = ETLPipeline(extractor=mock_extractor, cleaner=cleaner, loader=mock_loader)
        result = pipeline.run(source_table="test_data")

        self.assertEqual(result["status"], "SUCCESS")
        self.assertEqual(result["source_table"], "test_data")
        self.assertEqual(result["metrics"]["rows_extracted"], 3)
        self.assertEqual(result["metrics"]["rows_cleaned"], 2)
        self.assertEqual(result["metrics"]["rows_dropped"], 1)
        self.assertEqual(result["metrics"]["rows_loaded"], 2)
