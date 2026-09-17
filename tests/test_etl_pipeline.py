"""Unit and Integration Tests for Sales Order ETL Pipeline."""

from datetime import date, datetime, timezone
from unittest.mock import MagicMock, patch
import numpy as np
import pandas as pd
import pytest

from server.bigquery_loader import BigQueryLoader, SCHEMA_DEFINITIONS
from server.gcs_extractor import GCSExtractor, parse_gcs_uri
from server.main import run_pipeline
from server.transformation_engine import TransformationEngine


class TestGCSExtractor:
    """Tests for GCS extraction functionality."""

    def test_parse_gcs_uri_valid(self):
        bucket, blob = parse_gcs_uri("gs://sdlc-workspec-store/etl/data/raw_sales_data.csv")
        assert bucket == "sdlc-workspec-store"
        assert blob == "etl/data/raw_sales_data.csv"

    def test_parse_gcs_uri_invalid(self):
        with pytest.raises(ValueError, match="Invalid GCS URI"):
            parse_gcs_uri("https://storage.googleapis.com/bucket/file.csv")

    def test_extract_csv_success(self):
        mock_client = MagicMock()
        mock_bucket = MagicMock()
        mock_blob = MagicMock()

        csv_content = (
            b"order_id,customer_id,customer_name,customer_email,product_category,amount,currency,order_status,created_at\n"
            b"1001,CUST-201,Alice Johnson,alice@example.com,Electronics,299.99,USD,COMPLETED,2026-09-01T10:14:22Z\n"
            b"1002,CUST-202,Bob Smith,bob@example.com,Home,49.50,USD,COMPLETED,2026-09-01T11:05:10Z\n"
        )
        mock_blob.exists.return_value = True
        mock_blob.size = len(csv_content)
        mock_blob.download_as_bytes.return_value = csv_content
        mock_bucket.blob.return_value = mock_blob
        mock_client.bucket.return_value = mock_bucket

        extractor = GCSExtractor(storage_client=mock_client)
        df = extractor.extract_csv("gs://my-bucket/data/sales.csv")

        assert df is not None
        assert len(df) == 2
        assert list(df["order_id"]) == ["1001", "1002"]

    def test_extract_csv_file_not_found(self):
        mock_client = MagicMock()
        mock_bucket = MagicMock()
        mock_blob = MagicMock()

        mock_blob.exists.return_value = False
        mock_bucket.blob.return_value = mock_blob
        mock_client.bucket.return_value = mock_bucket

        extractor = GCSExtractor(storage_client=mock_client)
        df = extractor.extract_csv("gs://my-bucket/data/missing.csv")
        assert df is None

    def test_extract_csv_empty_file(self):
        mock_client = MagicMock()
        mock_bucket = MagicMock()
        mock_blob = MagicMock()

        mock_blob.exists.return_value = True
        mock_blob.size = 0
        mock_bucket.blob.return_value = mock_blob
        mock_client.bucket.return_value = mock_bucket

        extractor = GCSExtractor(storage_client=mock_client)
        df = extractor.extract_csv("gs://my-bucket/data/empty.csv")
        assert df is not None
        assert df.empty


class TestTransformationEngine:
    """Tests for data cleaning, type conversion, and deduplication."""

    @pytest.fixture
    def engine(self):
        return TransformationEngine()

    def test_clean_and_deduplicate(self, engine):
        raw_data = {
            "order_id": [" 1001 ", "1002", "1001", " 1003 "],
            "customer_id": [" CUST-1 ", "CUST-2", "CUST-1", "CUST-3"],
            "customer_name": ["Alice  ", "Bob", "Alice Updated", "Charlie"],
            "customer_email": ["alice@example.com", "N/A", "alice.new@example.com", None],
            "product_category": ["Electronics", "Books", "Electronics", "NULL"],
            "amount": ["$299.99", " 49.50 ", "$350.00", "15.00"],
            "currency": ["usd", "USD", "usd", "USD"],
            "order_status": ["completed", "PENDING", "COMPLETED", "cancelled"],
            "created_at": [
                "2026-09-01T10:00:00Z",
                "2026-09-01T11:00:00Z",
                "2026-09-01T12:00:00Z",  # Later updated record for 1001
                "2026-09-01T13:00:00Z",
            ],
        }
        raw_df = pd.DataFrame(raw_data)
        clean_df, metrics = engine.transform(raw_df)

        assert metrics["records_ingested"] == 4
        assert metrics["records_deduplicated"] == 1
        assert metrics["records_loaded"] == 3
        assert len(clean_df) == 3

        # Verify duplicate 1001 kept the newer record ($350.00, Alice Updated)
        row_1001 = clean_df[clean_df["order_id"] == "1001"].iloc[0]
        assert row_1001["customer_name"] == "Alice Updated"
        assert row_1001["amount"] == 350.00
        assert row_1001["currency"] == "USD"
        assert row_1001["order_status"] == "COMPLETED"

        # Verify null handling: "N/A" -> None, "NULL" -> None
        row_1002 = clean_df[clean_df["order_id"] == "1002"].iloc[0]
        assert row_1002["customer_email"] is None

        row_1003 = clean_df[clean_df["order_id"] == "1003"].iloc[0]
        assert row_1003["product_category"] is None

        # Verify order_date derived from created_at
        assert row_1001["order_date"] == date(2026, 9, 1)
        assert row_1001["ingestion_timestamp"] is not None

    def test_missing_order_id_dropped(self, engine):
        raw_data = {
            "order_id": ["1001", "", "null", None, "1002"],
            "customer_id": ["C1", "C2", "C3", "C4", "C5"],
            "amount": ["10", "20", "30", "40", "50"],
            "created_at": ["2026-09-01T10:00:00Z"] * 5,
        }
        raw_df = pd.DataFrame(raw_data)
        clean_df, metrics = engine.transform(raw_df)

        assert metrics["records_ingested"] == 5
        assert metrics["records_loaded"] == 2
        assert set(clean_df["order_id"]) == {"1001", "1002"}

    def test_whitespace_and_null_representations(self, engine):
        """Validates that whitespace is trimmed and all null representations become None strictly."""
        assert engine.sanitize_nulls("  N/A  ") is None
        assert engine.sanitize_nulls("  null  ") is None
        assert engine.sanitize_nulls("  NULL  ") is None
        assert engine.sanitize_nulls("  None  ") is None
        assert engine.sanitize_nulls("  nil  ") is None
        assert engine.sanitize_nulls("  undefined  ") is None
        assert engine.sanitize_nulls("   ") is None
        assert engine.sanitize_nulls("") is None
        assert engine.sanitize_nulls(None) is None
        assert engine.sanitize_nulls(pd.NA) is None
        assert engine.sanitize_nulls(float("nan")) is None
        assert engine.sanitize_nulls(np.nan) is None
        assert engine.sanitize_nulls("  John Doe  ") == "John Doe"

        assert engine.clean_string("  N/A  ") is None
        assert engine.clean_string("  null  ") is None
        assert engine.clean_string("  NULL  ") is None
        assert engine.clean_string("  None  ") is None
        assert engine.clean_string("  nan  ") is None
        assert engine.clean_string("  <NA>  ") is None
        assert engine.clean_string("  ") is None
        assert engine.clean_string(None) is None
        assert engine.clean_string(float("nan")) is None
        assert engine.clean_string(np.nan) is None
        assert engine.clean_string(pd.NA) is None
        assert engine.clean_string("  Alice Smith  ") == "Alice Smith"
        assert engine.clean_string(1001) == "1001"

    def test_nan_to_none_in_dataframe_rows(self, engine):
        """Validates that NaN, float('nan'), np.nan, pd.NA, and 'N/A' in DataFrames evaluate strictly to None."""
        raw_df = pd.DataFrame({
            "order_id": ["101", "102", "103", "104", "105"],
            "customer_id": ["C1", "C2", "C3", "C4", "C5"],
            "customer_email": [float("nan"), np.nan, pd.NA, "N/A", "user@test.com"],
            "amount": [10.0, 20.0, 30.0, 40.0, 50.0],
            "created_at": ["2026-09-01T10:00:00Z"] * 5,
        })
        clean_df, _ = engine.transform(raw_df)
        assert len(clean_df) == 5

        for i in range(4):
            row = clean_df.iloc[i]
            assert row["customer_email"] is None
            assert type(row["customer_email"]) is type(None)

        assert clean_df.iloc[4]["customer_email"] == "user@test.com"

    def test_numeric_parsing(self, engine):
        """Validates robust numeric parsing."""
        assert engine.parse_numeric("$1,234.56") == 1234.56
        assert engine.parse_numeric("  49.50  ") == 49.50
        assert engine.parse_numeric(100) == 100.0
        assert engine.parse_numeric(None) is None
        assert engine.parse_numeric("N/A") is None
        assert engine.parse_numeric(float("nan")) is None
        assert engine.parse_numeric(np.nan) is None
        assert engine.parse_numeric("  ") is None
        assert engine.parse_numeric("$ -") is None

    def test_timestamp_parsing(self, engine):
        """Validates robust timestamp parsing."""
        ts = engine.parse_timestamp("2026-09-01T10:14:22Z")
        assert ts is not None
        assert ts.year == 2026
        assert ts.tzinfo is not None or getattr(ts, "tz", None) is not None
        assert engine.parse_timestamp("N/A") is None
        assert engine.parse_timestamp(float("nan")) is None
        assert engine.parse_timestamp(np.nan) is None
        assert engine.parse_timestamp(None) is None

    def test_empty_dataframe(self, engine):
        empty_df = pd.DataFrame()
        clean_df, metrics = engine.transform(empty_df)
        assert clean_df.empty
        assert metrics["records_ingested"] == 0
        assert metrics["records_loaded"] == 0


class TestBigQueryLoader:
    """Tests for BigQuery dataset/table management and loading."""

    def test_ensure_table_exists(self):
        mock_bq_client = MagicMock()
        loader = BigQueryLoader(
            project_id="upbeat-repeater-477110-q6",
            dataset_id="analytics",
            table_id="new_sales_orders",
            bq_client=mock_bq_client,
        )

        loader.ensure_table_exists()
        mock_bq_client.create_dataset.assert_called_once()
        mock_bq_client.create_table.assert_called_once()

    def test_load_dataframe_success(self):
        mock_bq_client = MagicMock()
        mock_job = MagicMock()
        mock_job.job_id = "job-12345"
        mock_bq_client.load_table_from_dataframe.return_value = mock_job

        loader = BigQueryLoader(
            project_id="upbeat-repeater-477110-q6",
            dataset_id="analytics",
            table_id="new_sales_orders",
            bq_client=mock_bq_client,
        )

        test_df = pd.DataFrame({
            "order_id": ["1001"],
            "order_date": [date(2026, 9, 1)],
            "customer_id": ["CUST-1"],
            "customer_name": ["Alice"],
            "customer_email": ["alice@example.com"],
            "product_category": ["Electronics"],
            "amount": [299.99],
            "currency": ["USD"],
            "order_status": ["COMPLETED"],
            "created_at": [pd.Timestamp("2026-09-01T10:14:22Z")],
            "ingestion_timestamp": [pd.Timestamp.now(tz="UTC")],
        })

        rows_loaded = loader.load_dataframe(test_df, write_disposition="WRITE_APPEND")
        assert rows_loaded == 1
        mock_bq_client.load_table_from_dataframe.assert_called_once()
        mock_job.result.assert_called_once()


class TestMainPipeline:
    """End-to-end orchestration tests."""

    def test_run_pipeline_success(self):
        mock_extractor = MagicMock()
        mock_transformer = MagicMock()
        mock_loader = MagicMock()

        raw_df = pd.DataFrame({"order_id": ["1001", "1002"]})
        clean_df = pd.DataFrame({"order_id": ["1001", "1002"], "order_date": [date(2026, 9, 1), date(2026, 9, 1)]})
        mock_extractor.extract_csv.return_value = raw_df
        mock_transformer.transform.return_value = (clean_df, {
            "records_ingested": 2,
            "records_cleaned": 2,
            "records_deduplicated": 0,
            "records_loaded": 2,
        })
        mock_loader.load_dataframe.return_value = 2

        summary = run_pipeline(
            source_uri="gs://bucket/sales.csv",
            project_id="test-proj",
            dataset="analytics",
            table="new_sales_orders",
            extractor=mock_extractor,
            transformer=mock_transformer,
            loader=mock_loader,
        )

        assert summary["status"] == "SUCCESS"
        assert summary["records_ingested"] == 2
        assert summary["records_loaded"] == 2

    def test_run_pipeline_missing_file_circuit_breaker(self):
        mock_extractor = MagicMock()
        mock_extractor.extract_csv.return_value = None

        summary = run_pipeline(
            source_uri="gs://bucket/missing.csv",
            project_id="test-proj",
            dataset="analytics",
            table="new_sales_orders",
            extractor=mock_extractor,
        )

        assert summary["status"] == "SKIPPED"
        assert summary["reason"] == "SOURCE_FILE_NOT_FOUND"
        assert summary["records_loaded"] == 0
