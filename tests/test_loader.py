from unittest.mock import MagicMock
import pandas as pd
from datetime import datetime, timezone
from google.cloud.exceptions import NotFound

from server.loader import get_bigquery_schema, ensure_dataset_and_table, load_to_bigquery
from server.main import run_pipeline


def test_get_bigquery_schema():
    schema = get_bigquery_schema()
    field_names = [f.name for f in schema]
    assert "order_id" in field_names
    assert "customer_id" in field_names
    assert "product_id" in field_names
    assert "quantity" in field_names
    assert "unit_price" in field_names
    assert "total_amount" in field_names
    assert "created_at" in field_names
    assert "batch_id" in field_names


def test_ensure_dataset_and_table_when_missing():
    mock_client = MagicMock()
    mock_client.get_dataset.side_effect = NotFound("Dataset missing")
    mock_client.get_table.side_effect = NotFound("Table missing")

    ensure_dataset_and_table(
        client=mock_client,
        project_id="test-proj",
        dataset_id="analytics",
        table_id="new_sales_orders",
    )

    mock_client.create_dataset.assert_called_once()
    mock_client.create_table.assert_called_once()


def test_load_to_bigquery_success():
    clean_df = pd.DataFrame(
        [
            {
                "order_id": "ORD-1",
                "customer_id": "CUST-1",
                "product_id": "PROD-1",
                "product_category": "Electronics",
                "quantity": 2,
                "unit_price": 25.0,
                "total_amount": 50.0,
                "order_status": "COMPLETED",
                "created_at": datetime(2026, 5, 18, 10, 0, 0, tzinfo=timezone.utc),
                "ingested_at": datetime(2026, 5, 18, 10, 5, 0, tzinfo=timezone.utc),
                "batch_id": "batch-1",
            }
        ]
    )

    mock_client = MagicMock()
    mock_load_job = MagicMock()
    mock_load_job.job_id = "job_12345"
    mock_client.load_table_from_dataframe.return_value = mock_load_job

    loaded = load_to_bigquery(
        df=clean_df,
        project_id="test-proj",
        dataset_id="analytics",
        table_id="new_sales_orders",
        client=mock_client,
    )

    assert loaded == 1
    mock_client.load_table_from_dataframe.assert_called_once()
    mock_load_job.result.assert_called_once()


def test_load_to_bigquery_empty():
    mock_client = MagicMock()
    loaded = load_to_bigquery(
        df=pd.DataFrame(),
        project_id="test-proj",
        dataset_id="analytics",
        table_id="new_sales_orders",
        client=mock_client,
    )
    assert loaded == 0
    mock_client.load_table_from_dataframe.assert_not_called()


def test_run_pipeline_end_to_end():
    csv_bytes = b"order_id,customer_id,product_id,quantity,unit_price,created_at\nORD-1,CUST-1,PROD-1,2,10.0,2026-05-18T10:00:00Z\nORD-1,CUST-1,PROD-1,2,10.0,2026-05-18T10:00:00Z\n"
    
    # Mock Storage
    mock_storage = MagicMock()
    mock_bucket = MagicMock()
    mock_blob = MagicMock()
    mock_storage.bucket.return_value = mock_bucket
    mock_bucket.blob.return_value = mock_blob
    mock_blob.exists.return_value = True
    mock_blob.download_as_bytes.return_value = csv_bytes

    # Mock BigQuery
    mock_bq = MagicMock()
    mock_job = MagicMock()
    mock_job.job_id = "job-e2e"
    mock_bq.load_table_from_dataframe.return_value = mock_job

    metrics = run_pipeline(
        gcs_uri="gs://test-bucket/test_sales.csv",
        project_id="test-proj",
        dataset_id="analytics",
        table_id="new_sales_orders",
        storage_client=mock_storage,
        bq_client=mock_bq,
    )

    assert metrics.raw_records == 2
    assert metrics.deduplicated_records == 1
    assert metrics.clean_records_to_load == 1
    assert metrics.quarantined_records == 0
